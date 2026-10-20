// TangerineDragHook
// Watches for a file drag starting in Explorer, the desktop, or a file dialog.
// When Shift / Ctrl / Alt is pressed during that drag, prints a JSON line that
// tells the Electron overlay which wheel to show. No input is swallowed except
// the Escape key while the wheel is open.

using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

internal static class Program
{
    private const int WH_MOUSE_LL = 14;
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_LBUTTONDOWN = 0x0201;
    private const int WM_LBUTTONUP = 0x0202;
    private const int WM_MOUSEMOVE = 0x0200;
    private const int WM_KEYDOWN = 0x0100;
    private const int WM_SYSKEYDOWN = 0x0104;
    private const int WM_KEYUP = 0x0101;
    private const int WM_SYSKEYUP = 0x0105;

    private const int VK_SHIFT = 0x10;
    private const int VK_CONTROL = 0x11;
    private const int VK_MENU = 0x12;
    private const int VK_ESCAPE = 0x1B;

    private const uint GA_ROOT = 2;

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int X;
        public int Y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MSLLHOOKSTRUCT
    {
        public POINT pt;
        public uint mouseData;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KBDLLHOOKSTRUCT
    {
        public uint vkCode;
        public uint scanCode;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    private delegate IntPtr LowLevelProc(int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("user32.dll")]
    private static extern IntPtr WindowFromPoint(POINT point);

    [DllImport("user32.dll")]
    private static extern IntPtr GetAncestor(IntPtr hwnd, uint gaFlags);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    private static extern short GetAsyncKeyState(int vKey);

    [DllImport("user32.dll")]
    private static extern bool GetCursorPos(out POINT lpPoint);

    [DllImport("user32.dll")]
    private static extern IntPtr SetProcessDpiAwarenessContext(IntPtr value);

    [DllImport("user32.dll")]
    private static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    private static extern int GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

    [DllImport("user32.dll")]
    private static extern bool TranslateMessage(ref MSG lpMsg);

    [DllImport("user32.dll")]
    private static extern IntPtr DispatchMessage(ref MSG lpMsg);

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG
    {
        public IntPtr hwnd;
        public uint message;
        public IntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public POINT pt;
    }

    private static IntPtr _mouseHook = IntPtr.Zero;
    private static IntPtr _keyboardHook = IntPtr.Zero;
    private static LowLevelProc _mouseProc;
    private static LowLevelProc _keyboardProc;
    private static readonly object WriteLock = new object();

    private static bool _candidate;
    private static bool _dragging;
    private static bool _wheelOpen;
    private static bool _cancelled;
    private static int _startX;
    private static int _startY;
    private static int _lastX;
    private static int _lastY;
    private static int _parentPid;
    private static string _mode;
    private static long _lastMoveSent;

    private static int Main(string[] args)
    {
        try { Console.OutputEncoding = Encoding.UTF8; } catch { }
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (args[i] == "--parent")
            {
                int.TryParse(args[i + 1], out _parentPid);
            }
        }

        try
        {
            SetProcessDpiAwarenessContext(new IntPtr(-4));
        }
        catch
        {
            try { SetProcessDPIAware(); } catch { }
        }

        _mouseProc = MouseHook;
        _keyboardProc = KeyboardHook;
        IntPtr module = GetModuleHandle(null);
        _mouseHook = SetWindowsHookEx(WH_MOUSE_LL, _mouseProc, module, 0);
        _keyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, _keyboardProc, module, 0);
        if (_mouseHook == IntPtr.Zero || _keyboardHook == IntPtr.Zero)
        {
            return 1;
        }

        if (_parentPid > 0)
        {
            var watchdog = new Thread(WatchParent) { IsBackground = true };
            watchdog.Start();
        }

        MSG msg;
        while (GetMessage(out msg, IntPtr.Zero, 0, 0) > 0)
        {
            TranslateMessage(ref msg);
            DispatchMessage(ref msg);
        }

        UnhookWindowsHookEx(_mouseHook);
        UnhookWindowsHookEx(_keyboardHook);
        return 0;
    }

    private static void WatchParent()
    {
        while (true)
        {
            Thread.Sleep(1200);
            try
            {
                Process.GetProcessById(_parentPid);
            }
            catch
            {
                Environment.Exit(0);
            }
        }
    }

    private static void Emit(string json)
    {
        lock (WriteLock)
        {
            try
            {
                Console.Out.WriteLine(json);
                Console.Out.Flush();
            }
            catch { }
        }
    }

    private static string ClassOf(IntPtr hwnd)
    {
        var buffer = new StringBuilder(256);
        GetClassName(hwnd, buffer, buffer.Capacity);
        return buffer.ToString();
    }

    private static bool IsFileSource(POINT point)
    {
        IntPtr hwnd = WindowFromPoint(point);
        if (hwnd == IntPtr.Zero) return false;
        IntPtr root = GetAncestor(hwnd, GA_ROOT);
        if (root == IntPtr.Zero) root = hwnd;

        uint pid;
        GetWindowThreadProcessId(root, out pid);
        if (_parentPid > 0 && pid == (uint)_parentPid) return false;

        string rootClass = ClassOf(root);
        if (rootClass == "CabinetWClass" || rootClass == "ExploreWClass" ||
            rootClass == "Progman" || rootClass == "WorkerW" ||
            rootClass == "#32770" || rootClass == "ApplicationFrameHost")
        {
            return true;
        }

        string childClass = ClassOf(hwnd);
        return childClass == "SysListView32" || childClass == "DirectUIHWND" || childClass == "ShellView";
    }

    private static string HeldMode()
    {
        if ((GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0) return "convert";
        if ((GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0) return "tools";
        if ((GetAsyncKeyState(VK_MENU) & 0x8000) != 0) return "actions";
        return null;
    }

    private static void ShowWheel(string mode, int x, int y)
    {
        _mode = mode;
        _wheelOpen = true;
        Emit("{\"type\":\"show\",\"mode\":\"" + mode + "\",\"x\":" + x + ",\"y\":" + y + "}");
    }

    private static IntPtr MouseHook(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            var data = (MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
            int message = wParam.ToInt32();
            int x = data.pt.X;
            int y = data.pt.Y;

            if (message == WM_LBUTTONDOWN)
            {
                _candidate = IsFileSource(data.pt);
                _dragging = false;
                _wheelOpen = false;
                _cancelled = false;
                _mode = null;
                _startX = x;
                _startY = y;
                _lastX = x;
                _lastY = y;
            }
            else if (message == WM_MOUSEMOVE && _candidate && !_cancelled)
            {
                int dx = x - _startX;
                int dy = y - _startY;
                if (!_dragging && (dx * dx + dy * dy) >= 49)
                {
                    _dragging = true;
                    string held = HeldMode();
                    if (held != null) ShowWheel(held, x, y);
                }

                if (_dragging && _wheelOpen)
                {
                    long now = Environment.TickCount;
                    if (now - _lastMoveSent > 30)
                    {
                        _lastMoveSent = now;
                        Emit("{\"type\":\"move\",\"x\":" + x + ",\"y\":" + y + "}");
                    }
                }
                _lastX = x;
                _lastY = y;
            }
            else if (message == WM_LBUTTONUP)
            {
                if (_wheelOpen)
                {
                    Emit("{\"type\":\"mouseup\"}");
                }
                _candidate = false;
                _dragging = false;
                _wheelOpen = false;
                _cancelled = false;
                _mode = null;
            }
        }
        return CallNextHookEx(_mouseHook, nCode, wParam, lParam);
    }

    private static IntPtr KeyboardHook(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            var data = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
            int message = wParam.ToInt32();
            int vk = (int)data.vkCode;
            bool down = message == WM_KEYDOWN || message == WM_SYSKEYDOWN;

            if (down && _dragging && !_cancelled)
            {
                string next = null;
                if (vk == VK_SHIFT) next = "convert";
                else if (vk == VK_CONTROL) next = "tools";
                else if (vk == VK_MENU) next = "actions";
                else if (vk == VK_ESCAPE && _wheelOpen)
                {
                    Emit("{\"type\":\"cancel\"}");
                    _wheelOpen = false;
                    _cancelled = true;
                    return (IntPtr)1;
                }

                if (next != null)
                {
                    if (!_wheelOpen)
                    {
                        POINT point;
                        if (GetCursorPos(out point)) ShowWheel(next, point.X, point.Y);
                        else ShowWheel(next, _lastX, _lastY);
                    }
                    else if (_mode != next)
                    {
                        _mode = next;
                        Emit("{\"type\":\"mode\",\"mode\":\"" + next + "\"}");
                    }
                    return (IntPtr)1;
                }
            }
        }
        return CallNextHookEx(_keyboardHook, nCode, wParam, lParam);
    }
}
