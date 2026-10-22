<p align="center">
  <img src="assets/brand.svg" width="76" alt="Wheel and Form">
</p>

<h1 align="center">Wheel and Form</h1>

<p align="center">
  <strong>모든 형식, 한 번의 회전.</strong><br>
  Windows를 위한 로컬 우선 파일 작업대.
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">简体中文</a> ·
  <strong>한국어</strong> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.de.md">Deutsch</a>
</p>

<p align="center">
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases/latest"><img src="https://img.shields.io/github/v/release/Nolane-x/Wheel-and-form?style=flat-square&amp;label=release&amp;color=d6f542&amp;labelColor=111512" alt="최신 릴리스"></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-111512?style=flat-square" alt="Windows 10 및 11">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Nolane-x/Wheel-and-form?style=flat-square&amp;color=d6f542&amp;labelColor=111512" alt="MIT 라이선스"></a>
  <img src="https://img.shields.io/badge/processing-local-d6f542?style=flat-square&amp;labelColor=111512" alt="로컬 처리">
  <img src="https://img.shields.io/badge/languages-8-d6f542?style=flat-square&amp;labelColor=111512" alt="8 languages">
</p>

<p align="center">
  <a href="https://nolane-x.github.io/Wheel-and-form/"><strong>제품 사이트&nbsp;&nbsp;↗</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases/latest"><strong>Windows용 다운로드&nbsp;&nbsp;↘</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/Nolane-x/Wheel-and-form/releases">릴리스 노트</a>
</p>

![Wheel and Form 작업대](site/assets/screenshots/workbench-body.png)

Wheel and Form은 보통 다섯 개의 다른 웹사이트를 오가야 하는 파일 작업을 한곳에서 끝내는 Windows 데스크톱 앱입니다. 변환, 압축, 압축 해제, 자르기, 다듬기, 병합, 가리기, 정리를 모두 로컬에서 처리합니다. 파일을 끌기 시작하고 키를 누른 다음 방사형 휠에서 작업을 마치세요. 계정도, 업로드도, 클라우드 대기열도 없습니다.

- **303가지 변환** — **53가지 입력 형식**과 **39가지 출력 형식** 지원
- **26개의 집중 도구** — 이미지, 동영상, 오디오, PDF, 문서, 압축 파일용
- **6가지 파일 작업** — 공유/복사, 플로팅 미리보기, 복제, 이동, 경로 복사, 터미널 열기
- **시스템 전역 데스크톱 휠** — 앱을 열지 않고 탐색기, 바탕 화면 또는 파일 대화상자에서 사용
- **네이티브 Windows 셸 통합** — 출력 위치 열기, 파일 열기, 경로 복사, 파일 폴더에서 터미널 열기
- **원클릭 업데이트** — GitHub 릴리스 체크섬으로 확인하고 한 번 재시작하면 설치
- **기본은 로컬 처리** — 파일 읽기와 쓰기가 내 PC에서 이루어집니다

---

## 작업대

여러 파일을 한 번에 대기열에 넣고 파일마다 대상 형식을 고른 뒤 변환하세요. 출력은 기본적으로 원본 옆에 생성되므로 처음 작업한 파일은 절대 이동하지 않습니다. 모든 작업은 새 파일을 씁니다.

![변환 하나가 완료된 작업 대기열](site/assets/screenshots/conversion-done.png)

- 이미지, PDF, 문서, 오디오, 동영상, 압축 파일을 섞은 대기열
- 하나의 전역 모드가 아닌 파일별 출력 위치
- 실제 진행률, 읽기 쉬운 오류, 계속 확인할 수 있는 활동 로그
- 작업대를 떠나지 않고 완료된 파일 열기, 위치 확인, 공유

## 휠

휠은 앱 전체를 위한 키보드 우선 단축 경로입니다. 파일을 끄는 동안 보조 키를 누르면 포인터 아래에 해당 대상이 나타납니다.

| 키 | 휠 | 표시 내용 |
| --- | --- | --- |
| `Shift` | Formats | 파일의 출력 형식 |
| `Ctrl` | Tools | 파일 형식에 맞는 집중 도구 |
| `Alt` | Actions | 공유/복사, 미리보기, 복제, 이동, 경로 복사, 터미널 |

![작업대 위의 형식 휠](site/assets/screenshots/wheel.png)

대상 위에서 놓으면 실행됩니다. 방향키와 `Enter`도 사용할 수 있습니다. 휠은 드래그가 시작된 위치를 기억하고 작업 결과를 원본 옆에 남깁니다.

### 앱 밖에서

같은 휠을 Windows 어디서나 사용할 수 있습니다. 탐색기, 바탕 화면 또는 파일 대화상자에서 파일을 끌기 시작한 다음 `Shift`, `Ctrl` 또는 `Alt`를 누르세요. 활성 디스플레이의 포인터 위치에 휠이 나타납니다. 취소하려면 `Escape`를 누릅니다.

![Windows 탐색기 위의 시스템 전역 휠](site/assets/screenshots/desktop-wheel-crop.png)

앱 밖에서는 결과가 항상 원본 옆에 작성되며 원본은 변경되지 않습니다. 작은 상태 카드가 진행률을 보여 주고, 결과 위치를 열거나 엔진이 없을 때 엔진 설정을 열 수 있게 합니다.

기본 창을 닫아도 Wheel and Form은 알림 영역에서 계속 실행됩니다. 트레이 아이콘을 마우스 오른쪽 버튼으로 클릭하면 앱 다시 열기, 데스크톱 휠 전환, Settings 열기 또는 종료를 할 수 있습니다.

---

## 형식

53가지 입력 형식과 39가지 출력 형식을 제품군별로 정리한 계속 업데이트되는 인덱스입니다. 검색하거나 필터링하거나, 휠이 가능성 높은 대상을 먼저 보여 주게 하세요.

![변환 인덱스](site/assets/screenshots/formats.png)

| 제품군 | 변환 수 | 예시 |
| --- | ---: | --- |
| 이미지 | 73 | PNG, JPG, WEBP, HEIC, TIFF, AVIF, BMP, SVG, ICO |
| 동영상 | 42 | MP4, MOV, MKV, WEBM, AVI, GIF |
| 오디오 | 56 | MP3, M4A, WAV, FLAC, OGG, AAC, OPUS |
| PDF | 9 | PDF → JPG/PNG/TXT/DOCX/PPTX/XLSX, PDF 생성 |
| 문서 | 71 | DOCX, PAGES, PDF, TXT, MD, HTML, RTF, ODT |
| 슬라이드 | 6 | PPTX, PPT, PDF, JPG, PNG |
| 스프레드시트 | 21 | XLSX, XLS, ODS, CSV, TSV, PDF |
| 자막 | 4 | SRT, VTT, TXT |
| 압축 파일 | 20 | ZIP, 7Z, TAR, GZIP, 재포장 및 폴더 아카이브 |
| 폴더 | 1 | 폴더 → ZIP |

## 도구

마지막 단계를 위한 26개의 집중 도구입니다. 모든 도구는 로컬에서 실행되고 결과를 미리 보여 주며 원본을 그대로 둡니다.

![실시간 미리보기가 있는 자르기 도구](site/assets/screenshots/tool-crop.png)

Compress · Remove Metadata · Edit Image · Annotate · Add Background · Crop · Redact · Normalize Audio · Mute Video · Trim Video · Split PDF · Organize PDF · Extract Archive · Create PDF · Merge PDFs · Crop Video · Change Speed · Join Videos · Snapshots · Split Video · Audio to Video · Trim Audio · Audio Channels · Bleep Audio · Redact Video · Create Collage

PDF 분할, 병합, 정리, 생성은 프로세스 내 `pdf-lib`로 처리하므로 외부 엔진 없이 작동합니다.

---

## 기본은 로컬 처리

계정 없음. 업로드 없음. 서버 대기열 없음. 변환, 도구, 미리보기가 내 PC에서 실행됩니다. 설정은 Electron 사용자 데이터 폴더의 작은 JSON 파일에 저장되며 텔레메트리는 전송되지 않습니다.

| 출력 설정 | 엔진 설정 |
| --- | --- |
| ![출력 설정](site/assets/screenshots/settings-output.png) | ![엔진 설정](site/assets/screenshots/settings-engines.png) |

Wheel and Form이 네트워크 요청을 하는 경우는 두 가지뿐입니다.

- 앱 업데이트를 위해 GitHub Releases를 확인할 때
- 사용자가 요청할 때 `winget`으로 변환 엔진을 설치할 때

업데이트 확인은 공개 릴리스 메타데이터만 읽습니다. 다운로드에는 새 앱 빌드만 포함됩니다. 파일 이름, 파일 내용, 사용 데이터, 개인 데이터는 전송되지 않습니다.

## 요구 사항 및 엔진

Wheel and Form은 런타임에 일반적인 변환 엔진을 감지합니다. 없는 엔진은 **Settings → Engines**에서 `winget`으로 설치하거나, 이미 설치된 실행 파일을 앱에 지정할 수 있습니다.

| 엔진 | 용도 | 필수 여부 |
| --- | --- | --- |
| [FFmpeg](https://ffmpeg.org/) | 동영상/오디오 변환, 다듬기, 음소거, 스냅샷, 기본 래스터 폴백 | 권장 |
| [ImageMagick](https://imagemagick.org/) | 고급 이미지 편집, 메타데이터 제거, 자르기, 주석, 가리기 | 선택 |
| [Pandoc](https://pandoc.org/) | 텍스트/Markdown/HTML 문서 변환 | 선택 |
| [LibreOffice](https://www.libreoffice.org/) | Office 문서 변환 및 PDF 출력 | 선택 |
| [7-Zip](https://www.7-zip.org/) | 압축 파일 생성 및 압축 해제 | 선택 |
| [Ghostscript](https://www.ghostscript.com/) | PDF 래스터화 및 PDF 텍스트 추출 | 선택 |

PDF 도구는 바로 작동합니다. ImageMagick이 없을 때 일반 래스터 형식(PNG/JPG/WEBP/TIFF/GIF)은 FFmpeg로 폴백합니다.

## 설치

1. [최신 릴리스](https://github.com/Nolane-x/Wheel-and-form/releases/latest)를 엽니다.
2. `Wheel-and-Form-Setup-<version>.exe`를 다운로드합니다.
3. 설치 프로그램을 실행하고 대상 폴더를 선택합니다. 사용자별 설치이므로 관리자 계정이 필요하지 않습니다.

설치 프로그램에는 코드 서명이 없으므로 Windows SmartScreen이 첫 실행 시 확인을 요청할 수 있습니다.

## 업데이트

설치된 빌드는 시작할 때와 6시간마다 GitHub Releases를 확인합니다. 새 릴리스가 있으면 제목 표시줄과 **Settings → Updates**에 표시됩니다. 거기서 다운로드하고 재시작하세요.

업데이트는 릴리스 체크섬으로 확인되며 파일이나 환경 설정을 건드리지 않습니다. **Settings → Updates**에서 수동으로 확인할 수도 있습니다.

## 개발

```bash
npm install
npm start
```

유용한 검사:

```bash
node --check electron/main.js
powershell -ExecutionPolicy Bypass -File native/build.ps1
npm run build:win
```

데스크톱 휠은 작은 네이티브 도우미를 사용합니다. 전역 드래그를 감지하고 네이티브 OLE 드롭 대상을 소유하며, Electron은 그 위에 휠만 그립니다. `native/build.ps1`은 Windows에 포함된 .NET Framework 컴파일러로 빌드하며, 생성된 실행 파일은 설치 프로그램에 자동으로 복사됩니다.

## Windows 설치 프로그램 빌드

```bash
npm run build:win
```

출력은 `dist/`에 기록됩니다.

- `Wheel-and-Form-Setup-<version>.exe` — NSIS 설치 프로그램
- `latest.yml` 및 blockmap — 설치된 빌드가 사용하는 업데이트 메타데이터
- 로컬 검사를 위한 압축 해제된 애플리케이션 파일

한 번에 빌드하고 GitHub에 게시하려면:

```powershell
$env:GH_TOKEN = "github-token-with-repo-scope"
npm run release:win
```

`.github/workflows/build.yml`의 GitHub Actions 워크플로가 `windows-latest`에서 같은 설치 프로그램을 빌드하고 artifact로 업로드합니다.

## 프로젝트 구조

```text
electron/
  main.js                  Electron 창, 트레이, IPC, 파일 및 변환 작업
  desktop.js               데스크톱 오버레이, 상태 카드, 네이티브 드래그 도우미
  preload.js               안전한 window.api 브리지
  settings.js              JSON 환경 설정
  updater.js               GitHub 릴리스 확인, 다운로드 상태 및 설치 인계
  converter/
    registry.js            변환, 도구, 작업 정의
    engine.js              엔진 탐색 및 프로세스 실행
    pdf.js                 pdf-lib 기반 PDF 도구
    subtitle.js            자막 도우미
src/
  index.html               앱 셸
  styles.css               Precision Workshop 디자인 시스템, 셸, 뷰, 대기열
  styles-wheel.css         방사형 휠 및 데스크톱 오버레이
  styles-modal.css         설정 및 도구 대화상자
  app.js                   대기열, 뷰, 통계, 활동
  interactions.js          휠, 드래그 앤 드롭, 작업, 키보드
  wheel.js                 방사형 휠 지오메트리 및 렌더링
  desktop.html/css/js      투명한 시스템 전역 휠 오버레이
  desktop-status.*         진행률 및 결과 카드
  settings.js              설정, 엔진 설치, 업데이트 상태
  update.js                제목 표시줄 업데이트 필, 안내, 원클릭 작업
  toolmodal.js             도구 옵션 및 미리보기
  float.js                 플로팅 미리보기 창
native/
  WheelAndFormDragHook.cs  네이티브 드래그 감지기 및 OLE 드롭 대상
  build.ps1                Windows .NET 컴파일러로 도우미 빌드
site/                      GitHub Pages로 배포되는 정적 제품 사이트
assets/                    앱 아이콘, 브랜드 마크, 글꼴
```

## 제품 사이트

정적 사이트는 [`site/`](site/)에 있으며 `.github/workflows/deploy-pages.yml`로 배포됩니다. 동일한 Precision Workshop 디자인 시스템, 실제 앱 스크린샷, 영어·베트남어·일본어·중국어·한국어·스페인어·프랑스어·독일어 8개 언어 문구를 사용합니다.

로컬 미리보기:

```bash
python -m http.server 8123 --directory site
```

그런 다음 `http://127.0.0.1:8123/`을 여세요.

## 라이선스

MIT. [LICENSE](LICENSE)를 참고하세요. Wheel and Form은 독립적인 Windows 애플리케이션입니다.

---

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">简体中文</a> ·
  <strong>한국어</strong> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="https://github.com/Nolane-x/Wheel-and-form">GitHub</a>
</p>
