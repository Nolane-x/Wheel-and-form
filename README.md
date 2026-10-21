# Tangerine for Windows

A local-first file converter, compressor and toolkit for Windows — inspired by [Tangerine for Mac](https://tangerineformac.com/).

Drop a file, hold a key, and pick what you need from a radial wheel. Everything runs on your PC. No account, no upload, no queue in the cloud.

> This is an independent Windows companion/tribute project. It is not affiliated with or endorsed by the original Tangerine app.

## What it does

- **303 conversions** across 53 input formats and 39 output formats
- **26 focused tools** for images, video, audio, PDF, documents and archives
- **6 file actions** — share/copy, floating preview, duplicate, move, copy path, open terminal
- **Local-only processing** — files are read and written on your machine
- **Keyboard-first radial wheel** — `Shift` for formats, `Ctrl` for tools, `Alt` for file actions
- **System-wide desktop wheel** — start a drag in Explorer or on the desktop, hold a key, and finish on the wheel without opening the app first
- **Native Windows shell integration** — reveal outputs, open files, copy paths and open a terminal in the file's folder

### Format families

| Family | Conversions | Examples |
| --- | ---: | --- |
| Images | 73 | PNG, JPG, WEBP, HEIC, TIFF, AVIF, BMP, SVG, ICO |
| Video | 42 | MP4, MOV, MKV, WEBM, AVI, GIF |
| Audio | 56 | MP3, M4A, WAV, FLAC, OGG, AAC, OPUS |
| PDF | 9 | PDF → JPG/PNG/TXT/DOCX/PPTX/XLSX, PDF creation |
| Documents | 71 | DOCX, PAGES, PDF, TXT, MD, HTML, RTF, ODT |
| Slides | 6 | PPTX, PPT, PDF, JPG, PNG |
| Spreadsheets | 21 | XLSX, XLS, ODS, CSV, TSV, PDF |
| Subtitles | 4 | SRT, VTT, TXT |
| Archives | 20 | ZIP, 7Z, TAR, GZIP, repacking and folder archives |
| Folders | 1 | Folder → ZIP |

### Tools

Compress · Remove Metadata · Edit Image · Annotate · Add Background · Crop · Redact · Normalize Audio · Mute Video · Trim Video · Split PDF · Organize PDF · Extract Archive · Create PDF · Merge PDFs · Crop Video · Change Speed · Join Videos · Snapshots · Split Video · Audio to Video · Trim Audio · Audio Channels · Bleep Audio · Redact Video · Create Collage

PDF split, merge, organize and create are handled in-process with `pdf-lib`, so they work without any external engine.

## How the wheel works

1. Add files with **Choose files** or drag them onto the window.
2. Pick a target format in the queue, or open a wheel from a file row.
3. Hold a key while dragging a file to open the matching wheel immediately:
   - `Shift` — output formats
   - `Ctrl` — tools
   - `Alt` — file actions
4. Release over a petal. You can also move with the arrow keys and press `Enter`.

The app remembers your output choice and can reveal results in Explorer when a job finishes.

### Outside the app

The same wheel works anywhere in Windows. Start dragging a file in Explorer, on the desktop, or from a file dialog and hold `Shift`, `Ctrl`, or `Alt`. The wheel appears at the pointer on the display you are using. Drop on a petal to run the job, or press `Escape` to cancel.

Outside the app, results are always written beside the original file and the source is never changed. A small status card shows progress, then lets you reveal the result or open engine setup if something is missing.

Closing the main window leaves Tangerine running in the notification area. Right-click the tray icon to reopen it, turn the desktop wheel on or off, open Settings, or quit.

## Requirements

Tangerine detects common conversion engines at runtime. Missing engines can be installed from **Settings → Engines** with `winget`, or you can point the app at an existing executable.

| Engine | Used for | Required? |
| --- | --- | --- |
| [FFmpeg](https://ffmpeg.org/) | video/audio conversion, trim, mute, snapshots, basic raster fallback | Recommended |
| [ImageMagick](https://imagemagick.org/) | advanced image edits, metadata removal, cropping, annotation, redaction | Optional |
| [Pandoc](https://pandoc.org/) | text/Markdown/HTML document conversions | Optional |
| [LibreOffice](https://www.libreoffice.org/) | Office document conversion and PDF output | Optional |
| [7-Zip](https://www.7-zip.org/) | archive creation and extraction | Optional |
| [Ghostscript](https://www.ghostscript.com/) | PDF rasterization and PDF text extraction | Optional |

PDF tools work out of the box. Common raster conversions (PNG/JPG/WEBP/TIFF/GIF) fall back to FFmpeg when ImageMagick is not available.

## Install

Download the latest Windows installer from the repository's **Releases** page and run it. The installer lets you choose the destination folder; no administrator account is required for a per-user install.

## Development

```bash
npm install
npm start
```

Useful checks:

```bash
node --check electron/main.js
powershell -ExecutionPolicy Bypass -File native/build.ps1
npm run build:win
```

The desktop wheel uses a tiny native helper. It detects global drags and owns the native OLE drop target; Electron only paints the wheel on top. `native/build.ps1` compiles it with the .NET Framework compiler that ships with Windows; the built executable is copied into the installer automatically.

## Build a Windows installer

```bash
npm run build:win
```

Outputs are written to `dist/`:

- `Tangerine Setup <version>.exe` — NSIS installer
- unpacked application files for local inspection

The GitHub Actions workflow in `.github/workflows/build.yml` builds the same installer on `windows-latest` and uploads it as an artifact.

## Project layout

```text
electron/
  main.js              Electron window, tray, IPC, file and conversion jobs
  desktop.js           Desktop overlay, status card, native drag helper
  preload.js           Safe window.api bridge
  settings.js          JSON preferences
  converter/
    registry.js        Conversion, tool and action definitions
    engine.js          Engine discovery and process execution
    pdf.js             pdf-lib-backed PDF tools
    subtitle.js        Subtitle helpers
src/
  index.html           App shell
  styles*.css          Light theme, wheel, modal and view styles
  app.js               Queue, views, stats and activity
  interactions.js      Wheels, drag/drop, actions and keyboard
  wheel.js             Radial wheel geometry and rendering
  desktop.html/css/js  Transparent system-wide wheel overlay
  desktop-status.*     Progress and result card
  settings.js          Settings and engine setup
  toolmodal.js         Tool options and previews
  float.js             Floating preview window
native/
  TangerineDragHook.cs Native drag detector and OLE drop target
  build.ps1            Builds the helper with the Windows .NET compiler
assets/                Icons, fonts and hero artwork
```

## Privacy

Files never leave this PC. Settings and activity are stored locally in the Electron user-data folder. The app makes no network requests except when you explicitly ask it to install an engine through `winget`.

## License

MIT. See [LICENSE](LICENSE). Tangerine is a trademark of its respective owner; this project is an independent work.
