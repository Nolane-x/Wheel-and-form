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
using System.Drawing;
using System.Windows.Forms;

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

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MONITORINFO
    {
        public int cbSize;
        public RECT rcMonitor;
        public RECT rcWork;
        public uint dwFlags;
    }

    private const uint MONITOR_DEFAULTTONEAREST = 2;
    private const int RGN_DIFF = 4;
    private const uint SWP_NOSIZE = 0x0001;
    private const uint SWP_NOMOVE = 0x0002;
    private const uint SWP_NOACTIVATE = 0x0010;
    private const uint SWP_SHOWWINDOW = 0x0040;
    private static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    private static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromPoint(POINT pt, uint dwFlags);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int x, int y, int cx, int cy, uint flags);

    [DllImport("user32.dll")]
    private static extern int SetWindowRgn(IntPtr hWnd, IntPtr hRgn, bool bRedraw);

    [DllImport("gdi32.dll")]
    private static extern IntPtr CreateRectRgn(int left, int top, int right, int bottom);

    [DllImport("gdi32.dll")]
    private static extern IntPtr CreateEllipticRgn(int left, int top, int right, int bottom);

    [DllImport("gdi32.dll")]
    private static extern int CombineRgn(IntPtr hrgnDest, IntPtr hrgnSrc1, IntPtr hrgnSrc2, int fnCombineMode);

    [DllImport("gdi32.dll")]
    private static extern bool DeleteObject(IntPtr hObject);

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

    private static DropForm _dropForm;
    private static Thread _dropThread;
    private static readonly ManualResetEventSlim DropReady = new ManualResetEventSlim(false);
    private static long _lastHoverSent;

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

        StartDropTarget();

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
        string childClass = ClassOf(hwnd);
        bool shellItem = childClass == "SysListView32" || childClass == "DirectUIHWND" || childClass == "ShellView";

        // For Explorer windows only the file area is a drag source. Clicking
        // the title bar, ribbon, or scrollbar must not arm the wheel.
        if (rootClass == "CabinetWClass" || rootClass == "ExploreWClass") return shellItem;
        if (rootClass == "Progman" || rootClass == "WorkerW" ||
            rootClass == "#32770" || rootClass == "ApplicationFrameHost")
        {
            return true;
        }
        return shellItem;
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
        ArmDropForm(x, y);
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
                if (_candidate)
                {
                    PrepareDropForm(x, y);
                    Emit("{\"type\":\"candidate\",\"x\":" + x + ",\"y\":" + y + "}");
                }
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
                if (_candidate || _wheelOpen)
                {
                    Emit("{\"type\":\"mouseup\",\"open\":" + (_wheelOpen ? "true" : "false") + "}");
                    HideDropForm(true);
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
                    HideDropForm(false);
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

    // -----------------------------------------------------------------------
    // Native OLE drop target
    //
    // Electron cannot receive an Explorer drag in a window that is shown after
    // the drag has begun, even when the window is click-through beforehand.
    // This invisible WinForms window exists before the drag starts and owns the
    // real OLE drop target. It is shown with an empty region on mouse-down, so
    // a normal file drag is untouched. When the wheel opens it gets a region
    // that covers the monitor except for a hole at the drag origin, and the
    // Electron page only paints the wheel.
    // -----------------------------------------------------------------------

    private static void StartDropTarget()
    {
        if (_dropForm != null) return;
        _dropThread = new Thread(() =>
        {
            try
            {
                Application.EnableVisualStyles();
                _dropForm = new DropForm();
                DropReady.Set();
                Application.Run();
            }
            catch (Exception ex)
            {
                DropReady.Set();
                try { Console.Error.WriteLine(ex.ToString()); } catch { }
            }
        });
        _dropThread.IsBackground = true;
        _dropThread.SetApartmentState(ApartmentState.STA);
        _dropThread.Start();
        DropReady.Wait(2500);
    }

    private static void InvokeDrop(Action<DropForm> action)
    {
        DropForm form = _dropForm;
        if (form == null || form.IsDisposed) return;
        try
        {
            form.BeginInvoke((Action)(() =>
            {
                if (!form.IsDisposed) action(form);
            }));
        }
        catch { }
    }

    private static void PrepareDropForm(int x, int y)
    {
        InvokeDrop(form => form.Prepare(x, y));
    }

    private static void ArmDropForm(int x, int y)
    {
        InvokeDrop(form => form.Arm(x, y));
    }

    private static void HideDropForm(bool soon)
    {
        InvokeDrop(form =>
        {
            if (soon) form.HideSoon();
            else form.Disarm();
        });
    }

    private static MONITORINFO MonitorAt(int x, int y)
    {
        var point = new POINT { X = x, Y = y };
        IntPtr monitor = MonitorFromPoint(point, MONITOR_DEFAULTTONEAREST);
        var info = new MONITORINFO();
        info.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
        if (monitor != IntPtr.Zero) GetMonitorInfo(monitor, ref info);
        return info;
    }

    private static string JsonString(string value)
    {
        var builder = new StringBuilder();
        builder.Append('"');
        foreach (char ch in value)
        {
            switch (ch)
            {
                case '"': builder.Append("\\\""); break;
                case '\\': builder.Append("\\\\"); break;
                case '\n': builder.Append("\\n"); break;
                case '\r': builder.Append("\\r"); break;
                case '\t': builder.Append("\\t"); break;
                default:
                    if (ch < 32) builder.Append("\\u").Append(((int)ch).ToString("x4"));
                    else builder.Append(ch);
                    break;
            }
        }
        builder.Append('"');
        return builder.ToString();
    }

    private static string PathsJson(string[] files)
    {
        var builder = new StringBuilder();
        builder.Append('[');
        for (int i = 0; i < files.Length; i++)
        {
            if (i > 0) builder.Append(',');
            builder.Append(JsonString(files[i]));
        }
        builder.Append(']');
        return builder.ToString();
    }

    private static void EmitPaths(string type, string[] files, int x, int y)
    {
        Emit("{\"type\":\"" + type + "\",\"x\":" + x + ",\"y\":" + y + ",\"paths\":" + PathsJson(files) + "}");
    }

    private sealed class DropForm : Form
    {
        private readonly System.Windows.Forms.Timer _topmostTimer;
        private readonly System.Windows.Forms.Timer _hideTimer;
        private int _monitorLeft;
        private int _monitorTop;
        private int _monitorWidth;
        private int _monitorHeight;
        private int _holeX;
        private int _holeY;

        public DropForm()
        {
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            TopMost = true;
            StartPosition = FormStartPosition.Manual;
            AutoScaleMode = AutoScaleMode.None;
            BackColor = Color.Black;
            Opacity = 0.01;
            AllowDrop = true;
            Width = 300;
            Height = 300;
            DoubleBuffered = true;

            _topmostTimer = new System.Windows.Forms.Timer();
            _topmostTimer.Interval = 250;
            _topmostTimer.Tick += (sender, args) => KeepTopmost();

            _hideTimer = new System.Windows.Forms.Timer();
            _hideTimer.Interval = 600;
            _hideTimer.Tick += (sender, args) => Disarm();

            // Force the native window and its OLE drop target to exist before
            // the first drag starts.
            IntPtr force = Handle;

            DragEnter += OnDragEnter;
            DragOver += OnDragOver;
            DragLeave += OnDragLeave;
            DragDrop += OnDragDrop;
        }

        protected override bool ShowWithoutActivation
        {
            get { return true; }
        }

        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams cp = base.CreateParams;
                cp.ExStyle |= 0x08000000; // WS_EX_NOACTIVATE
                cp.ExStyle |= 0x00000080; // WS_EX_TOOLWINDOW
                return cp;
            }
        }

        public void Prepare(int x, int y)
        {
            _hideTimer.Stop();
            MONITORINFO info = MonitorAt(x, y);
            _monitorLeft = info.rcMonitor.Left;
            _monitorTop = info.rcMonitor.Top;
            _monitorWidth = Math.Max(1, info.rcMonitor.Right - info.rcMonitor.Left);
            _monitorHeight = Math.Max(1, info.rcMonitor.Bottom - info.rcMonitor.Top);

            SetBounds(_monitorLeft, _monitorTop, _monitorWidth, _monitorHeight);
            SetEmptyRegion();
            if (!Visible) Show();
            SetWindowPos(Handle, HWND_TOPMOST, _monitorLeft, _monitorTop, _monitorWidth, _monitorHeight,
                SWP_NOACTIVATE | SWP_SHOWWINDOW);
            KeepTopmost();
            _topmostTimer.Start();
        }

        public void Arm(int x, int y)
        {
            // The threshold can be crossed on a different monitor than the
            // mouse-down. Move the native drop window to the display that owns
            // the cursor before shaping the ring.
            MONITORINFO info = MonitorAt(x, y);
            _monitorLeft = info.rcMonitor.Left;
            _monitorTop = info.rcMonitor.Top;
            _monitorWidth = Math.Max(1, info.rcMonitor.Right - info.rcMonitor.Left);
            _monitorHeight = Math.Max(1, info.rcMonitor.Bottom - info.rcMonitor.Top);

            if (!Visible) Show();
            SetBounds(_monitorLeft, _monitorTop, _monitorWidth, _monitorHeight);
            _holeX = x - _monitorLeft;
            _holeY = y - _monitorTop;
            SetRingRegion(_monitorWidth, _monitorHeight, _holeX, _holeY, 44);
            SetWindowPos(Handle, HWND_TOPMOST, _monitorLeft, _monitorTop, _monitorWidth, _monitorHeight,
                SWP_NOACTIVATE | SWP_SHOWWINDOW);
            KeepTopmost();
            _topmostTimer.Start();
        }

        public void HideSoon()
        {
            if (!Visible) return;
            _hideTimer.Stop();
            _hideTimer.Start();
        }

        public void Disarm()
        {
            _hideTimer.Stop();
            _topmostTimer.Stop();
            SetEmptyRegion();
            if (Visible) Hide();
        }

        private void KeepTopmost()
        {
            if (!Visible) return;
            SetWindowPos(Handle, HWND_TOPMOST, 0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
        }

        private void SetEmptyRegion()
        {
            IntPtr empty = CreateRectRgn(0, 0, 0, 0);
            if (SetWindowRgn(Handle, empty, true) == 0) DeleteObject(empty);
        }

        private void SetRingRegion(int width, int height, int holeX, int holeY, int radius)
        {
            IntPtr full = CreateRectRgn(0, 0, width, height);
            IntPtr hole = CreateEllipticRgn(holeX - radius, holeY - radius, holeX + radius, holeY + radius);
            IntPtr result = CreateRectRgn(0, 0, 0, 0);
            CombineRgn(result, full, hole, RGN_DIFF);
            DeleteObject(full);
            DeleteObject(hole);
            if (SetWindowRgn(Handle, result, true) == 0) DeleteObject(result);
        }

        private void OnDragEnter(object sender, DragEventArgs e)
        {
            e.Effect = DragDropEffects.Copy;
            SendPaths("dragenter", e);
            SendHover(e, true);
        }

        private void OnDragOver(object sender, DragEventArgs e)
        {
            e.Effect = DragDropEffects.Copy;
            SendHover(e, false);
        }

        private void OnDragLeave(object sender, EventArgs e)
        {
            Emit("{\"type\":\"leave\"}");
        }

        private void OnDragDrop(object sender, DragEventArgs e)
        {
            e.Effect = DragDropEffects.Copy;
            SendPaths("drop", e);
            try { BeginInvoke((Action)Disarm); } catch { Disarm(); }
        }

        private void SendHover(DragEventArgs e, bool force)
        {
            long now = Environment.TickCount;
            if (!force && now - _lastHoverSent < 25) return;
            _lastHoverSent = now;
            int x = _monitorLeft + e.X;
            int y = _monitorTop + e.Y;
            Emit("{\"type\":\"hover\",\"x\":" + x + ",\"y\":" + y + "}");
        }

        private void SendPaths(string type, DragEventArgs e)
        {
            string[] files = null;
            try { files = e.Data.GetData(DataFormats.FileDrop) as string[]; } catch { }
            if (files == null || files.Length == 0)
            {
                try
                {
                    string one = e.Data.GetData("FileNameW") as string;
                    if (!string.IsNullOrEmpty(one)) files = new[] { one };
                }
                catch { }
            }
            if (files == null || files.Length == 0) return;
            EmitPaths(type, files, _monitorLeft + e.X, _monitorTop + e.Y);
        }
    }
}
