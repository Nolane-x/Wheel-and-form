<p align="center">
  <img src="assets/brand.svg" width="76" alt="Wheel and Form">
</p>

<h1 align="center">Wheel and Form</h1>

<p align="center">
  <strong>Every format. One turn.</strong><br>
  A local-first file workshop for Windows.
</p>

<p align="center">
  <strong>English</strong> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases/latest"><img src="https://img.shields.io/github/v/release/Nolane-x/Wheel-and-form?style=flat-square&amp;label=release&amp;color=d6f542&amp;labelColor=111512" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-111512?style=flat-square" alt="Windows 10 and 11">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Nolane-x/Wheel-and-form?style=flat-square&amp;color=d6f542&amp;labelColor=111512" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/processing-local-d6f542?style=flat-square&amp;labelColor=111512" alt="Local processing">
</p>

<p align="center">
  <a href="https://nolane-x.github.io/Wheel-and-form/"><strong>Product site&nbsp;&nbsp;↗</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases/latest"><strong>Download for Windows&nbsp;&nbsp;↘</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases">Release notes</a>
</p>

![Wheel and Form workbench](site/assets/screenshots/workbench-body.png)

Wheel and Form is a Windows desktop app for the file jobs that usually send you to five different websites. Convert, compress, extract, crop, trim, merge, redact and organize files locally. Start a drag, hold a key, and finish on a radial wheel. No account, no upload, no cloud queue.

- **303 conversions** across **53 input formats** and **39 output formats**
- **26 focused tools** for images, video, audio, PDFs, documents and archives
- **6 file actions** — share/copy, floating preview, duplicate, move, copy path, open terminal
- **System-wide desktop wheel** — use it from Explorer, the desktop or a file dialog without opening the app
- **Native Windows shell integration** — reveal outputs, open files, copy paths and open a terminal in the file's folder
- **One-click updates** — verified against the GitHub release checksum and installed after one restart
- **Local by default** — your files are read and written on your PC

---

## The workbench

Queue a mixed batch, choose a target for each file, and convert. Outputs land beside the source by default, so the file you started with never moves. Every operation writes a new file.

![Work queue with one completed conversion](site/assets/screenshots/conversion-done.png)

- Mixed image, PDF, document, audio, video and archive queues
- Per-file destinations instead of one global mode
- Real progress, readable errors and a persistent activity log
- Open, reveal or share a finished file without leaving the bench

## The wheel

The wheel is a keyboard-first shortcut for the whole app. Hold a modifier while dragging a file and the matching destinations appear under the pointer.

| Key | Wheel | What it shows |
| --- | --- | --- |
| `Shift` | Formats | Output formats for the file |
| `Ctrl` | Tools | Focused operations for the file type |
| `Alt` | Actions | Share/copy, preview, duplicate, move, copy path, terminal |

![Format wheel over the workbench](site/assets/screenshots/wheel.png)

Release over a destination to run it. Arrow keys and `Enter` work too. The wheel remembers where the drag started and keeps the work beside the original.

### Outside the app

The same wheel works anywhere in Windows. Start dragging a file in Explorer, on the desktop or from a file dialog, then hold `Shift`, `Ctrl` or `Alt`. The wheel appears at the pointer on the active display. Press `Escape` to cancel.

![System-wide wheel over Windows Explorer](site/assets/screenshots/desktop-wheel-crop.png)

Outside the app, results are always written beside the original and the source is never changed. A small status card shows progress, then lets you reveal the result or open engine setup when something is missing.

Closing the main window leaves Wheel and Form running in the notification area. Right-click the tray icon to reopen it, toggle the desktop wheel, open Settings or quit.

---

## Formats

A living index of 53 input and 39 output formats, grouped by family. Search it, filter it, or let the wheel surface the likely targets first.

![Conversion index](site/assets/screenshots/formats.png)

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

## Tools

26 focused tools for the last mile. Every tool runs locally, previews its result, and leaves the original untouched.

![Crop tool with live preview](site/assets/screenshots/tool-crop.png)

Compress · Remove Metadata · Edit Image · Annotate · Add Background · Crop · Redact · Normalize Audio · Mute Video · Trim Video · Split PDF · Organize PDF · Extract Archive · Create PDF · Merge PDFs · Crop Video · Change Speed · Join Videos · Snapshots · Split Video · Audio to Video · Trim Audio · Audio Channels · Bleep Audio · Redact Video · Create Collage

PDF split, merge, organize and create are handled in-process with `pdf-lib`, so they work without an external engine.

---

## Local by default

No account. No upload. No server-side queue. Conversion, tools and previews run on your machine. Settings live in a small JSON file in the Electron user-data folder; no telemetry is sent.

| Output | Engines |
| --- | --- |
| ![Output settings](site/assets/screenshots/settings-output.png) | ![Engine settings](site/assets/screenshots/settings-engines.png) |

Wheel and Form makes network requests in two cases only:

- checking GitHub Releases for app updates;
- installing a conversion engine through `winget` when you ask it to.

Update checks read public release metadata. Downloads contain only the new app build. No file names, file contents, usage data or personal data are sent.

## Requirements and engines

Wheel and Form detects common conversion engines at runtime. Missing engines can be installed from **Settings → Engines** with `winget`, or you can point the app at an existing executable.

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

1. Open the [latest release](https://github.com/Nolane-x/Wheel-and-form/releases/latest).
2. Download `Wheel-and-Form-Setup-<version>.exe`.
3. Run the installer and choose a destination folder. A per-user install does not require an administrator account.

The installer is not code-signed, so Windows SmartScreen may ask you to confirm the first launch.

## Updates

The installed build checks GitHub Releases when it starts and every six hours. When a newer release is available, the title bar and **Settings → Updates** show it. Download and restart from there.

Updates are verified against the release checksum and never touch your files or preferences. The check can also be run on demand from **Settings → Updates**.

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

The desktop wheel uses a small native helper. It detects global drags and owns the native OLE drop target; Electron only paints the wheel on top. `native/build.ps1` compiles it with the .NET Framework compiler that ships with Windows; the built executable is copied into the installer automatically.

## Build a Windows installer

```bash
npm run build:win
```

Outputs are written to `dist/`:

- `Wheel-and-Form-Setup-<version>.exe` — NSIS installer
- `latest.yml` and blockmap — update metadata used by installed builds
- unpacked application files for local inspection

To build and publish a release to GitHub in one step:

```powershell
$env:GH_TOKEN = "github-token-with-repo-scope"
npm run release:win
```

The GitHub Actions workflow in `.github/workflows/build.yml` builds the same installer on `windows-latest` and uploads it as an artifact.

## Project layout

```text
electron/
  main.js                  Electron window, tray, IPC, file and conversion jobs
  desktop.js               Desktop overlay, status card, native drag helper
  preload.js               Safe window.api bridge
  settings.js              JSON preferences
  updater.js               GitHub release checks, download state and install handoff
  converter/
    registry.js            Conversion, tool and action definitions
    engine.js              Engine discovery and process execution
    pdf.js                 pdf-lib-backed PDF tools
    subtitle.js            Subtitle helpers
src/
  index.html               App shell
  styles.css               Precision Workshop design system, shell, views and queue
  styles-wheel.css         Radial wheel and desktop overlay
  styles-modal.css         Settings and tool dialogs
  app.js                   Queue, views, stats and activity
  interactions.js          Wheels, drag/drop, actions and keyboard
  wheel.js                 Radial wheel geometry and rendering
  desktop.html/css/js      Transparent system-wide wheel overlay
  desktop-status.*         Progress and result card
  settings.js              Settings, engine setup and update status
  update.js                Title-bar update pill, prompts and one-click actions
  toolmodal.js             Tool options and previews
  float.js                 Floating preview window
native/
  WheelAndFormDragHook.cs  Native drag detector and OLE drop target
  build.ps1                Builds the helper with the Windows .NET compiler
site/                      Static product site, deployed by GitHub Pages
assets/                    App icon, brand mark and fonts
```

## Product site

The static site lives in [`site/`](site/) and is deployed by `.github/workflows/deploy-pages.yml`. It uses the same Precision Workshop design system, real app screenshots and English, Vietnamese and Japanese copy.

To preview it locally:

```bash
python -m http.server 8123 --directory site
```

Then open `http://127.0.0.1:8123/`.

## License

MIT. See [LICENSE](LICENSE). Wheel and Form is an independent Windows application.

---

<p align="center">
  <strong>English</strong> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="https://github.com/Nolane-x/Wheel-and-form">GitHub</a>
</p>
