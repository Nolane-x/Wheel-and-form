<p align="center">
  <img src="assets/brand.svg" width="76" alt="Wheel and Form">
</p>

<h1 align="center">Wheel and Form</h1>

<p align="center">
  <strong>すべての形式を。ひと回しで。</strong><br>
  Windows 向けのローカル優先ファイルワークショップ。
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <strong>日本語</strong> ·
  <a href="README.zh.md">简体中文</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.de.md">Deutsch</a>
</p>

<p align="center">
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases/latest"><img src="https://img.shields.io/github/v/release/Nolane-x/Wheel-and-form?style=flat-square&amp;label=release&amp;color=d6f542&amp;labelColor=111512" alt="最新リリース"></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-111512?style=flat-square" alt="Windows 10 および 11">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Nolane-x/Wheel-and-form?style=flat-square&amp;color=d6f542&amp;labelColor=111512" alt="MIT ライセンス"></a>
  <img src="https://img.shields.io/badge/processing-local-d6f542?style=flat-square&amp;labelColor=111512" alt="ローカル処理">
  <img src="https://img.shields.io/badge/languages-8-d6f542?style=flat-square&amp;labelColor=111512" alt="8 languages">
</p>

<p align="center">
  <a href="https://nolane-x.github.io/Wheel-and-form/"><strong>製品サイト&nbsp;&nbsp;↗</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases/latest"><strong>Windows 版をダウンロード&nbsp;&nbsp;↘</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases">リリースノート</a>
</p>

![Wheel and Form のワークベンチ](site/assets/screenshots/workbench-body.png)

Wheel and Form は、通常なら 5 つの別々の Web サイトを回ることになるファイル作業を、1 か所で片付ける Windows デスクトップアプリです。変換、圧縮、展開、切り抜き、トリミング、結合、墨消し、整理をローカルで実行できます。ドラッグを開始してキーを押し、ラジアルホイール上で完了できます。アカウントは不要です。アップロードもありません。クラウドの待ち行列もありません。

- **53 の入力形式**と **39 の出力形式**にまたがる **303 の変換**
- 画像、動画、音声、PDF、ドキュメント、アーカイブのための **26 の専用ツール**
- **6 つのファイルアクション** — 共有/コピー、フローティングプレビュー、複製、移動、パスのコピー、ターミナルを開く
- **システム全体で使えるデスクトップホイール** — アプリを開かずに、エクスプローラー、デスクトップ、ファイルダイアログから利用できます
- **Windows シェルとのネイティブ統合** — 出力を表示し、ファイルを開き、パスをコピーし、ファイルのあるフォルダーでターミナルを開けます
- **ワンクリックアップデート** — GitHub リリースのチェックサムで検証され、1 回の再起動後にインストールされます
- **デフォルトでローカル** — ファイルの読み書きはお使いの PC 上で行われます

---

## ワークベンチ

混在したバッチをキューに入れ、ファイルごとに出力先を選んで変換します。出力はデフォルトで元ファイルの隣に保存されるため、最初に手にしたファイルが移動することはありません。すべての操作が新しいファイルを書き出します。

![1 件の変換が完了したワークキュー](site/assets/screenshots/conversion-done.png)

- 画像、PDF、ドキュメント、音声、動画、アーカイブを混在させたキュー
- 単一のグローバルモードではなく、ファイルごとの出力先
- 実際の進捗、読みやすいエラー、永続的なアクティビティログ
- ワークベンチを離れずに、完了したファイルを開く・表示する・共有する

## ホイール

ホイールは、アプリ全体をキーボード中心で操作するためのショートカットです。ファイルをドラッグしながら修飾キーを押すと、ポインターの下に対応する出力先が表示されます。

| キー | ホイール | 表示内容 |
| --- | --- | --- |
| `Shift` | フォーマット | そのファイルの出力形式 |
| `Ctrl` | ツール | ファイル形式に応じた専用操作 |
| `Alt` | アクション | 共有/コピー、プレビュー、複製、移動、パスのコピー、ターミナル |

![ワークベンチ上に表示されたフォーマットホイール](site/assets/screenshots/wheel.png)

出力先の上で離すと実行されます。矢印キーと `Enter` でも操作できます。ホイールはドラッグを開始した場所を記憶し、作業結果を元ファイルのそばに残します。

### アプリの外から

同じホイールは Windows のどこでも使えます。エクスプローラー、デスクトップ、またはファイルダイアログでファイルのドラッグを開始し、`Shift`、`Ctrl`、`Alt` のいずれかを押してください。アクティブなディスプレイのポインター位置にホイールが表示されます。キャンセルするには `Escape` を押します。

![Windows エクスプローラー上に表示されたシステム全体ホイール](site/assets/screenshots/desktop-wheel-crop.png)

アプリの外では、結果は常に元ファイルのそばに書き出され、元ファイルが変更されることはありません。小さなステータスカードに進捗が表示され、完了後は結果を表示できます。不足しているものがある場合は、エンジン設定を開くこともできます。

メインウィンドウを閉じても、Wheel and Form は通知領域で動作を続けます。トレイアイコンを右クリックすると、ウィンドウの再表示、デスクトップホイールのオン/オフ、設定の表示、終了を行えます。

---

## フォーマット

53 の入力形式と 39 の出力形式をファミリー別にまとめた、常に更新される索引です。検索や絞り込みができるほか、ホイールに有力な変換先を優先表示させることもできます。

![変換インデックス](site/assets/screenshots/formats.png)

| ファミリー | 変換 | 例 |
| --- | ---: | --- |
| 画像 | 73 | PNG, JPG, WEBP, HEIC, TIFF, AVIF, BMP, SVG, ICO |
| 動画 | 42 | MP4, MOV, MKV, WEBM, AVI, GIF |
| 音声 | 56 | MP3, M4A, WAV, FLAC, OGG, AAC, OPUS |
| PDF | 9 | PDF → JPG/PNG/TXT/DOCX/PPTX/XLSX、PDF 作成 |
| ドキュメント | 71 | DOCX, PAGES, PDF, TXT, MD, HTML, RTF, ODT |
| スライド | 6 | PPTX, PPT, PDF, JPG, PNG |
| 表計算 | 21 | XLSX, XLS, ODS, CSV, TSV, PDF |
| 字幕 | 4 | SRT, VTT, TXT |
| アーカイブ | 20 | ZIP, 7Z, TAR, GZIP、再パッケージとフォルダーのアーカイブ |
| フォルダー | 1 | フォルダー → ZIP |

## ツール

最後の仕上げのための 26 の専用ツールです。すべてのツールはローカルで動作し、結果をプレビューし、元ファイルには手を加えません。

![ライブプレビュー付きの Crop ツール](site/assets/screenshots/tool-crop.png)

Compress · Remove Metadata · Edit Image · Annotate · Add Background · Crop · Redact · Normalize Audio · Mute Video · Trim Video · Split PDF · Organize PDF · Extract Archive · Create PDF · Merge PDFs · Crop Video · Change Speed · Join Videos · Snapshots · Split Video · Audio to Video · Trim Audio · Audio Channels · Bleep Audio · Redact Video · Create Collage

PDF の分割、結合、整理、作成は `pdf-lib` を使ってプロセス内で処理されるため、外部エンジンなしで動作します。

---

## デフォルトでローカル

アカウントは不要です。アップロードもありません。サーバー側の待ち行列もありません。変換、ツール、プレビューはお使いのマシン上で実行されます。設定は Electron の user-data フォルダー内の小さな JSON ファイルに保存され、テレメトリーは送信されません。

| 出力 | エンジン |
| --- | --- |
| ![出力設定](site/assets/screenshots/settings-output.png) | ![エンジン設定](site/assets/screenshots/settings-engines.png) |

Wheel and Form がネットワークリクエストを行うのは、次の 2 つの場合だけです。

- アプリの更新のために GitHub Releases を確認する場合
- ユーザーが指示したときに `winget` 経由で変換エンジンをインストールする場合

更新確認では、公開されているリリースのメタデータだけを読み取ります。ダウンロードに含まれるのは新しいアプリのビルドだけです。ファイル名、ファイルの内容、利用データ、個人データは一切送信されません。

## 動作要件とエンジン

Wheel and Form は実行時に一般的な変換エンジンを検出します。不足しているエンジンは **Settings → Engines** から `winget` でインストールできます。既存の実行ファイルをアプリに指定することもできます。

| エンジン | 用途 | 必須 |
| --- | --- | --- |
| [FFmpeg](https://ffmpeg.org/) | 動画/音声の変換、トリミング、ミュート、スナップショット、基本的なラスター処理のフォールバック | 推奨 |
| [ImageMagick](https://imagemagick.org/) | 高度な画像編集、メタデータ削除、切り抜き、注釈、墨消し | 任意 |
| [Pandoc](https://pandoc.org/) | テキスト/Markdown/HTML ドキュメントの変換 | 任意 |
| [LibreOffice](https://www.libreoffice.org/) | Office ドキュメントの変換と PDF 出力 | 任意 |
| [7-Zip](https://www.7-zip.org/) | アーカイブの作成と展開 | 任意 |
| [Ghostscript](https://www.ghostscript.com/) | PDF のラスタライズと PDF テキストの抽出 | 任意 |

PDF ツールは追加設定なしで利用できます。一般的なラスター変換（PNG/JPG/WEBP/TIFF/GIF）は、ImageMagick が利用できない場合に FFmpeg へフォールバックします。

## インストール

1. [最新リリース](https://github.com/Nolane-x/Wheel-and-form/releases/latest) を開きます。
2. `Wheel-and-Form-Setup-<version>.exe` をダウンロードします。
3. インストーラーを実行し、インストール先のフォルダーを選択します。ユーザー単位のインストールでは、管理者アカウントは不要です。

インストーラーはコード署名されていないため、初回起動時に Windows SmartScreen が確認を求める場合があります。

## アップデート

インストール済みのビルドは、起動時と 6 時間ごとに GitHub Releases を確認します。新しいリリースが利用可能な場合は、タイトルバーと **Settings → Updates** に表示されます。そこからダウンロードし、再起動してください。

アップデートはリリースのチェックサムで検証され、ファイルや設定が変更されることはありません。確認は **Settings → Updates** から任意のタイミングで実行することもできます。

## 開発

```bash
npm install
npm start
```

確認に便利なコマンドは次のとおりです。

```bash
node --check electron/main.js
powershell -ExecutionPolicy Bypass -File native/build.ps1
npm run build:win
```

デスクトップホイールは小さなネイティブヘルパーを使用します。このヘルパーがグローバルなドラッグを検出し、ネイティブの OLE ドロップターゲットを担います。Electron はその上にホイールを描画するだけです。`native/build.ps1` は、Windows に同梱されている .NET Framework コンパイラーでこれをコンパイルします。ビルドされた実行ファイルは自動的にインストーラーへコピーされます。

## Windows インストーラーのビルド

```bash
npm run build:win
```

出力は `dist/` に書き出されます。

- `Wheel-and-Form-Setup-<version>.exe` — NSIS インストーラー
- `latest.yml` と blockmap — インストール済みビルドが使用する更新メタデータ
- ローカルで確認するための、展開済みのアプリケーションファイル

ビルドと GitHub へのリリース公開を 1 つの手順で行うには、次のコマンドを実行します。

```powershell
$env:GH_TOKEN = "github-token-with-repo-scope"
npm run release:win
```

`.github/workflows/build.yml` にある GitHub Actions ワークフローは、`windows-latest` 上で同じインストーラーをビルドし、アーティファクトとしてアップロードします。

## プロジェクト構成

```text
electron/
  main.js                  Electron のウィンドウ、トレイ、IPC、ファイルと変換のジョブ
  desktop.js               デスクトップオーバーレイ、ステータスカード、ネイティブドラッグヘルパー
  preload.js               安全な window.api ブリッジ
  settings.js              JSON 設定
  updater.js               GitHub リリースの確認、ダウンロード状態、インストールの受け渡し
  converter/
    registry.js            変換、ツール、アクションの定義
    engine.js              エンジンの検出とプロセスの実行
    pdf.js                 pdf-lib を使った PDF ツール
    subtitle.js            字幕ヘルパー
src/
  index.html               アプリシェル
  styles.css               Precision Workshop デザインシステム、シェル、ビュー、キュー
  styles-wheel.css         ラジアルホイールとデスクトップオーバーレイ
  styles-modal.css         設定とツールのダイアログ
  app.js                   キュー、ビュー、統計、アクティビティ
  interactions.js          ホイール、ドラッグ＆ドロップ、アクション、キーボード
  wheel.js                 ラジアルホイールのジオメトリーと描画
  desktop.html/css/js      透過的なシステム全体ホイールオーバーレイ
  desktop-status.*         進捗と結果のカード
  settings.js              設定、エンジンセットアップ、アップデート状態
  update.js                タイトルバーの更新ピル、プロンプト、ワンクリックアクション
  toolmodal.js             ツールのオプションとプレビュー
  float.js                 フローティングプレビューウィンドウ
native/
  WheelAndFormDragHook.cs  ネイティブのドラッグ検出と OLE ドロップターゲット
  build.ps1                Windows の .NET コンパイラーでヘルパーをビルド
site/                      GitHub Pages でデプロイされる静的プロダクトサイト
assets/                    アプリアイコン、ブランドマーク、フォント
```

## プロダクトサイト

静的サイトは [`site/`](site/) にあり、`.github/workflows/deploy-pages.yml` によってデプロイされます。同じ Precision Workshop デザインシステム、実際のアプリのスクリーンショット、英語・ベトナム語・日本語・簡体字中国語・韓国語・スペイン語・フランス語・ドイツ語の 8 言語の文言を使用しています。

ローカルでプレビューするには、次のコマンドを実行します。

```bash
python -m http.server 8123 --directory site
```

その後、`http://127.0.0.1:8123/` を開きます。

## ライセンス

MIT ライセンスです。詳細は [LICENSE](LICENSE) をご覧ください。Wheel and Form は独立した Windows アプリケーションです。

---

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <strong>日本語</strong> ·
  <a href="README.zh.md">简体中文</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="https://github.com/Nolane-x/Wheel-and-form">GitHub</a>
</p>
