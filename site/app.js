const REPO = "Nolane-x/Wheel-and-form";
const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
const RELEASE_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const LANG_KEY = "wheel-and-form-site-language";
const SUPPORTED = ["en", "vi", "ja"];

const I18N = {
  en: {
    "meta.title": "Wheel and Form — Every format. One turn.",
    "meta.description": "A local-first file workshop for Windows. 303 conversions, 26 focused tools, and a system-wide radial wheel. No uploads, no account.",
    "a11y.skip": "Skip to content",
    "a11y.language": "Language",
    "brand.tag": "FILE WORKSHOP",
    "nav.workbench": "Workbench",
    "nav.formats": "Formats",
    "nav.tools": "Tools",
    "nav.desktop": "Desktop wheel",
    "nav.privacy": "Privacy",
    "nav.download": "Download",
    "nav.downloadLabel": "Download for Windows",

    "hero.eyebrow": "WINDOWS 10 / 11 · LOCAL-FIRST FILE WORKSHOP",
    "hero.title1": "Every format.",
    "hero.title2": "One turn.",
    "hero.lede": "Convert, compress, extract and shape files on your own PC. Start a drag, hold a key, and finish on the wheel — without an upload, an account, or a queue in someone else’s cloud.",
    "hero.download": "Download for Windows",
    "hero.explore": "Explore the workbench",
    "metric.routes": "conversion routes",
    "metric.formats": "in / out formats",
    "metric.tools": "focused tools",
    "metric.uploads": "uploads",
    "hero.plate": "PLATE 01 — WORKBENCH",
    "hero.caption": "Three files. Three destinations. Every result beside its source.",
    "alt.hero": "The Wheel and Form radial format wheel open over the workbench",

    "grammar.kicker": "THE GRAMMAR",
    "grammar.title": "Three keys. One wheel. No menus to hunt through.",
    "grammar.lede": "Wheel and Form turns the modifiers you already hold into one consistent file language. The same wheel appears inside the workbench and across Windows.",
    "grammar.centre": "LOCAL WORKBENCH",
    "grammar.note": "The wheel follows the cursor. Choose with a flick; release to commit.",
    "grammar.formats": "Formats",
    "grammar.formatsCopy": "303 conversion routes across images, documents, audio, video, ebooks, data and archives.",
    "grammar.tools": "Tools",
    "grammar.toolsCopy": "26 focused operations: crop, annotate, redact, compress, trim, normalize, split, merge, extract and more.",
    "grammar.actions": "Actions",
    "grammar.actionsCopy": "Six file actions that stay close to the work: share/copy, preview, duplicate, move, copy path and open terminal.",

    "workbench.kicker": "WORKBENCH",
    "workbench.title": "Drop a file. See every exit.",
    "workbench.lede": "Queue a mixed batch, set a destination per file, and convert. Outputs land beside the source by default, so the file you started with never moves.",
    "workbench.bullet1": "Mixed batches: images, PDFs, documents, audio, video and archives in one queue.",
    "workbench.bullet2": "Per-file targets. No global mode to reset between files.",
    "workbench.bullet3": "Real progress, explicit errors and a work log you can read.",
    "workbench.bullet4": "Open, reveal or share a finished file without leaving the bench.",
    "workbench.note": "The original is never overwritten. Every operation writes a new file.",
    "workbench.plate": "PLATE 02 — WORK QUEUE",
    "workbench.caption": "Three files in. One already converted. The rest wait at their own destinations.",
    "alt.workbench": "Three files queued in Wheel and Form, with one PNG converted to BMP",

    "formats.kicker": "FORMAT INDEX",
    "formats.title": "303 ways out of the same file.",
    "formats.lede": "A living index of 53 input and 39 output formats, grouped by family. Search it, filter it, or let the wheel surface the likely targets first.",
    "formats.routes": "conversion routes",
    "formats.inputs": "input formats",
    "formats.outputs": "output formats",
    "formats.families": "format families",
    "formats.plate": "PLATE 03 — CONVERSION INDEX",
    "formats.caption": "Every route is visible. The wheel is a shortcut, not a locked door.",
    "alt.formats": "The Wheel and Form conversion index with format families and output tiles",

    "tools.kicker": "TOOLBENCH",
    "tools.title": "The small operations that finish the job.",
    "tools.lede": "26 focused tools for the last mile. Each one runs locally, previews the result, and leaves the original untouched.",
    "tools.plate": "PLATE 04 — CROP",
    "tools.caption": "Crop with a live preview. Ratio, anchor, then run — no destructive edit.",
    "alt.crop": "The Crop tool in Wheel and Form with a live image preview and aspect ratio controls",
    "tools.chip1": "Compress",
    "tools.chip2": "Crop",
    "tools.chip3": "Annotate",
    "tools.chip4": "Redact",
    "tools.chip5": "Trim",
    "tools.chip6": "Mute",
    "tools.chip7": "Normalize",
    "tools.chip8": "Snapshot",
    "tools.chip9": "Split PDF",
    "tools.chip10": "Organize",
    "tools.chip11": "Extract",
    "tools.chip12": "Create PDF",
    "tools.bullet1": "Image, video, audio, PDF, document and archive tools in one bench.",
    "tools.bullet2": "Preview controls before anything is written.",
    "tools.bullet3": "Outputs carry a new name. The source stays intact.",
    "tools.note": "Need the full list? The workbench shows all 26 with the formats each one accepts.",

    "desktop.kicker": "SYSTEM-WIDE",
    "desktop.title": "The wheel follows you out of the app.",
    "desktop.lede": "Open Explorer. Start dragging a file. Hold Shift, Ctrl or Alt. The wheel appears at the cursor; choose a destination and release. No app window. No context switch.",
    "desktop.plate": "PLATE 05 — REAL CAPTURE / WINDOWS 11 EXPLORER",
    "desktop.live": "LIVE DRAG",
    "desktop.caption": "A real drag in Explorer. Shift opens formats; the wheel finishes the drop.",
    "alt.desktop": "The Wheel and Form radial wheel open over Windows Explorer during a real file drag",
    "desktop.step1": "Start a drag",
    "desktop.step1Copy": "Grab a file on the desktop or in Explorer as you normally would.",
    "desktop.step2": "Hold a key",
    "desktop.step2Copy": "Shift for formats, Ctrl for tools, Alt for file actions.",
    "desktop.step3": "Finish on the wheel",
    "desktop.step3Copy": "Flick to a destination and release. The output lands beside the source.",

    "privacy.kicker": "THE LOCAL RULE",
    "privacy.title": "Your files never leave the room.",
    "privacy.lede": "No account. No upload. No server-side queue. Conversion, tools and previews run on your machine. The only network calls are the update check you can see and engine installs you start yourself.",
    "privacy.row1": "Beside the original",
    "privacy.row1Copy": "The default output mode writes the new file next to its source. One folder, one tidy result.",
    "privacy.row2": "Original untouched",
    "privacy.row2Copy": "Every conversion and tool writes a new file. Nothing overwrites the input.",
    "privacy.row3": "Your engines",
    "privacy.row3Copy": "Use detected tools or point the app at an existing executable. Missing engines are optional.",
    "privacy.row4": "Transparent network",
    "privacy.row4Copy": "GitHub update checks and optional engine installs. Your files are never part of either.",
    "privacy.note": "Settings live in a small JSON file on this PC. No telemetry is sent.",
    "privacy.manifesto1": "The file stays.",
    "privacy.manifesto2": "The work moves.",
    "privacy.manifestoNote": "No upload. No account. No server queue.",
    "privacy.ledgerTitle": "NETWORK LEDGER",
    "privacy.ledgerFiles": "Your files — never sent",
    "privacy.ledgerGithub": "GitHub — update check only",
    "privacy.ledgerWinget": "winget — optional engine installs",
    "privacy.plate1": "PLATE 06 — OUTPUT",
    "privacy.plate2": "PLATE 07 — ENGINES",
    "alt.settingsOutput": "Output settings with Next to the original selected",
    "alt.settingsEngines": "Conversion engine status showing FFmpeg, Pandoc and 7-Zip ready and optional engines missing",

    "updates.kicker": "UPDATES",
    "updates.title": "A new build, one restart away.",
    "updates.lede": "The installed app checks GitHub Releases, verifies the download against the release checksum, and installs on restart. Your files and preferences stay where they are.",
    "updates.current": "Current release",
    "updates.notes": "Release notes",
    "updates.note": "The check is visible and can be run on demand from Settings → Updates. Updates are verified by checksum, not by a code-signing certificate.",

    "faq.kicker": "QUESTIONS",
    "faq.title": "Before you install.",
    "faq.q1": "Is Wheel and Form free?",
    "faq.a1": "Yes. It is MIT licensed. The installer is not code-signed, so Windows SmartScreen may ask you to confirm the first launch.",
    "faq.q2": "Does it upload my files?",
    "faq.a2": "No. Conversion, tools and previews run locally. The app contacts GitHub for update checks; optional engine installs use winget. Your files are never sent to either service.",
    "faq.q3": "What do I need to run it?",
    "faq.a3": "Windows 10 or 11. FFmpeg, Pandoc and 7-Zip are detected automatically. ImageMagick, LibreOffice and Ghostscript add optional routes and can be installed from Settings → Engines.",
    "faq.q4": "Can I keep outputs somewhere else?",
    "faq.a4": "Yes. Choose beside the original, one folder you pick, or ask every time. The default is beside the source.",
    "faq.q5": "Does the desktop wheel work in Explorer?",
    "faq.a5": "Yes. Enable Desktop wheel in Settings, then start a normal file drag on the desktop or in Explorer and hold Shift, Ctrl or Alt.",
    "faq.q6": "How do updates work?",
    "faq.a6": "The installed app checks GitHub Releases, verifies the download checksum, and offers a one-click install. The app restarts to finish the update.",

    "download.kicker": "READY WHEN YOU ARE",
    "download.title": "Put the workshop on your desktop.",
    "download.lede": "Windows 10 / 11 · native installer · local-first by default.",
    "download.button": "Download latest release",
    "download.source": "View source",
    "download.fine": "MIT licensed. Unsigned build; SmartScreen may ask for confirmation.",

    "footer.tagline": "A local-first file workshop for Windows.",
    "footer.product": "PRODUCT",
    "footer.project": "PROJECT",
    "footer.releases": "Releases",
    "footer.readme": "README",
    "footer.license": "License",
    "footer.language": "LANGUAGE",
    "footer.local": "BUILT FOR WINDOWS · KEPT ON YOUR MACHINE"
  },

  vi: {
    "meta.title": "Wheel and Form — Mọi định dạng. Một vòng xoay.",
    "meta.description": "Xưởng xử lý tệp ưu tiên cục bộ cho Windows. 303 tuyến chuyển đổi, 26 công cụ chuyên biệt và vòng xoay toàn hệ thống. Không tải lên, không tài khoản.",
    "a11y.skip": "Bỏ qua đến nội dung",
    "a11y.language": "Ngôn ngữ",
    "brand.tag": "XƯỞNG TỆP",
    "nav.workbench": "Bàn làm việc",
    "nav.formats": "Định dạng",
    "nav.tools": "Công cụ",
    "nav.desktop": "Vòng xoay desktop",
    "nav.privacy": "Riêng tư",
    "nav.download": "Tải về",
    "nav.downloadLabel": "Tải Wheel and Form cho Windows",

    "hero.eyebrow": "WINDOWS 10 / 11 · XỬ LÝ TỆP ƯU TIÊN CỤC BỘ",
    "hero.title1": "Mọi định dạng.",
    "hero.title2": "Một vòng xoay.",
    "hero.lede": "Chuyển đổi, nén, giải nén và chỉnh sửa tệp ngay trên máy của bạn. Bắt đầu kéo tệp, giữ một phím và kết thúc trên vòng xoay — không tải lên, không tài khoản, không xếp hàng trên đám mây của người khác.",
    "hero.download": "Tải cho Windows",
    "hero.explore": "Xem bàn làm việc",
    "metric.routes": "tuyến chuyển đổi",
    "metric.formats": "định dạng vào / ra",
    "metric.tools": "công cụ chuyên biệt",
    "metric.uploads": "lần tải lên",
    "hero.plate": "BẢN 01 — BÀN LÀM VIỆC",
    "hero.caption": "Ba tệp. Ba đích đến. Mọi kết quả nằm cạnh tệp nguồn.",
    "alt.hero": "Vòng xoay định dạng Wheel and Form mở trên bàn làm việc",

    "grammar.kicker": "CÚ PHÁP",
    "grammar.title": "Ba phím. Một vòng xoay. Không phải lục menu.",
    "grammar.lede": "Wheel and Form biến những phím bổ trợ quen thuộc thành một ngôn ngữ tệp thống nhất. Cùng một vòng xoay xuất hiện trong bàn làm việc và trên toàn Windows.",
    "grammar.centre": "BÀN LÀM VIỆC CỤC BỘ",
    "grammar.note": "Vòng xoay bám theo con trỏ. Chọn bằng một cú vuốt; thả ra để chốt.",
    "grammar.formats": "Định dạng",
    "grammar.formatsCopy": "303 tuyến chuyển đổi cho ảnh, tài liệu, âm thanh, video, ebook, dữ liệu và tệp nén.",
    "grammar.tools": "Công cụ",
    "grammar.toolsCopy": "26 thao tác chuyên biệt: cắt, chú thích, che, nén, tỉa, chuẩn hóa, tách, ghép, giải nén và hơn thế.",
    "grammar.actions": "Thao tác tệp",
    "grammar.actionsCopy": "Sáu thao tác tệp sát với công việc: chia sẻ/sao chép, xem trước, nhân bản, di chuyển, sao chép đường dẫn và mở terminal.",

    "workbench.kicker": "BÀN LÀM VIỆC",
    "workbench.title": "Thả tệp. Thấy mọi lối ra.",
    "workbench.lede": "Xếp một lô hỗn hợp, đặt đích cho từng tệp rồi chuyển đổi. Mặc định, kết quả nằm cạnh tệp gốc, nên tệp bạn bắt đầu không bao giờ bị di chuyển.",
    "workbench.bullet1": "Lô hỗn hợp: ảnh, PDF, tài liệu, âm thanh, video và tệp nén trong cùng một hàng đợi.",
    "workbench.bullet2": "Đích riêng cho từng tệp. Không cần đặt lại chế độ chung.",
    "workbench.bullet3": "Tiến trình thật, lỗi rõ ràng và nhật ký công việc dễ đọc.",
    "workbench.bullet4": "Mở, hiện trong thư mục hoặc chia sẻ tệp đã xong ngay tại bàn làm việc.",
    "workbench.note": "Tệp gốc không bao giờ bị ghi đè. Mỗi thao tác tạo một tệp mới.",
    "workbench.plate": "BẢN 02 — HÀNG ĐỢI",
    "workbench.caption": "Ba tệp vào. Một tệp đã xong. Hai tệp còn lại chờ đúng đích của mình.",
    "alt.workbench": "Ba tệp trong hàng đợi Wheel and Form, một ảnh PNG đã chuyển thành BMP",

    "formats.kicker": "DANH MỤC ĐỊNH DẠNG",
    "formats.title": "303 lối ra từ cùng một tệp.",
    "formats.lede": "Danh mục sống động gồm 53 định dạng đầu vào và 39 định dạng đầu ra, nhóm theo họ. Tìm kiếm, lọc, hoặc để vòng xoay gợi ý đích phù hợp trước.",
    "formats.routes": "tuyến chuyển đổi",
    "formats.inputs": "định dạng đầu vào",
    "formats.outputs": "định dạng đầu ra",
    "formats.families": "họ định dạng",
    "formats.plate": "BẢN 03 — DANH MỤC CHUYỂN ĐỔI",
    "formats.caption": "Mọi tuyến đều nhìn thấy. Vòng xoay là lối tắt, không phải cửa khóa.",
    "alt.formats": "Danh mục chuyển đổi Wheel and Form với các họ định dạng và ô đầu ra",

    "tools.kicker": "XƯỞNG CÔNG CỤ",
    "tools.title": "Những thao tác nhỏ hoàn thiện công việc.",
    "tools.lede": "26 công cụ chuyên biệt cho chặng cuối. Tất cả chạy cục bộ, xem trước kết quả và giữ nguyên tệp gốc.",
    "tools.plate": "BẢN 04 — CẮT ẢNH",
    "tools.caption": "Cắt với xem trước trực tiếp. Chọn tỉ lệ, điểm neo rồi chạy — không sửa phá hủy.",
    "alt.crop": "Công cụ Crop trong Wheel and Form với xem trước ảnh và điều khiển tỉ lệ",
    "tools.chip1": "Nén",
    "tools.chip2": "Cắt",
    "tools.chip3": "Chú thích",
    "tools.chip4": "Che",
    "tools.chip5": "Tỉa",
    "tools.chip6": "Tắt tiếng",
    "tools.chip7": "Chuẩn hóa",
    "tools.chip8": "Ảnh chụp",
    "tools.chip9": "Tách PDF",
    "tools.chip10": "Sắp xếp",
    "tools.chip11": "Giải nén",
    "tools.chip12": "Tạo PDF",
    "tools.bullet1": "Công cụ ảnh, video, âm thanh, PDF, tài liệu và tệp nén trong một xưởng.",
    "tools.bullet2": "Xem trước điều khiển trước khi ghi bất cứ thứ gì.",
    "tools.bullet3": "Kết quả mang tên mới. Tệp nguồn vẫn nguyên vẹn.",
    "tools.note": "Cần danh sách đầy đủ? Bàn làm việc hiển thị cả 26 công cụ cùng định dạng mà mỗi công cụ nhận.",

    "desktop.kicker": "TOÀN HỆ THỐNG",
    "desktop.title": "Vòng xoay theo bạn ra khỏi ứng dụng.",
    "desktop.lede": "Mở Explorer. Bắt đầu kéo một tệp. Giữ Shift, Ctrl hoặc Alt. Vòng xoay hiện tại con trỏ; chọn đích rồi thả. Không mở cửa sổ ứng dụng. Không đổi ngữ cảnh.",
    "desktop.plate": "BẢN 05 — ẢNH THẬT / WINDOWS 11 EXPLORER",
    "desktop.live": "ĐANG KÉO",
    "desktop.caption": "Một cú kéo thật trong Explorer. Shift mở định dạng; vòng xoay hoàn tất thả.",
    "alt.desktop": "Vòng xoay Wheel and Form mở trên Windows Explorer trong một cú kéo tệp thật",
    "desktop.step1": "Bắt đầu kéo",
    "desktop.step1Copy": "Nắm một tệp trên desktop hoặc trong Explorer như bình thường.",
    "desktop.step2": "Giữ một phím",
    "desktop.step2Copy": "Shift cho định dạng, Ctrl cho công cụ, Alt cho thao tác tệp.",
    "desktop.step3": "Kết thúc trên vòng xoay",
    "desktop.step3Copy": "Vuốt tới đích và thả. Kết quả nằm cạnh tệp gốc.",

    "privacy.kicker": "LUẬT CỤC BỘ",
    "privacy.title": "Tệp của bạn không bao giờ rời khỏi phòng.",
    "privacy.lede": "Không tài khoản. Không tải lên. Không hàng đợi trên máy chủ. Chuyển đổi, công cụ và xem trước chạy trên máy của bạn. Mạng chỉ được dùng cho kiểm tra cập nhật bạn thấy và các lần cài engine bạn tự bắt đầu.",
    "privacy.row1": "Cạnh tệp gốc",
    "privacy.row1Copy": "Chế độ mặc định ghi tệp mới ngay cạnh nguồn. Một thư mục, một kết quả gọn gàng.",
    "privacy.row2": "Tệp gốc nguyên vẹn",
    "privacy.row2Copy": "Mọi chuyển đổi và công cụ đều ghi tệp mới. Không gì ghi đè đầu vào.",
    "privacy.row3": "Engine của bạn",
    "privacy.row3Copy": "Dùng công cụ được phát hiện hoặc trỏ ứng dụng tới tệp thực thi có sẵn. Engine thiếu chỉ là tùy chọn.",
    "privacy.row4": "Mạng minh bạch",
    "privacy.row4Copy": "Kiểm tra cập nhật GitHub và cài engine tùy chọn. Tệp của bạn không tham gia vào cả hai.",
    "privacy.note": "Cài đặt nằm trong một tệp JSON nhỏ trên máy này. Không gửi telemetry.",
    "privacy.manifesto1": "Tệp ở lại.",
    "privacy.manifesto2": "Việc vẫn chạy.",
    "privacy.manifestoNote": "Không tải lên. Không tài khoản. Không hàng đợi máy chủ.",
    "privacy.ledgerTitle": "SỔ MẠNG",
    "privacy.ledgerFiles": "Tệp của bạn — không bao giờ gửi",
    "privacy.ledgerGithub": "GitHub — chỉ kiểm tra cập nhật",
    "privacy.ledgerWinget": "winget — cài engine tùy chọn",
    "privacy.plate1": "BẢN 06 — ĐẦU RA",
    "privacy.plate2": "BẢN 07 — ENGINE",
    "alt.settingsOutput": "Cài đặt đầu ra với tùy chọn Cạnh tệp gốc được chọn",
    "alt.settingsEngines": "Trạng thái engine chuyển đổi: FFmpeg, Pandoc và 7-Zip sẵn sàng, các engine tùy chọn còn thiếu",

    "updates.kicker": "CẬP NHẬT",
    "updates.title": "Bản mới, chỉ cách một lần khởi động lại.",
    "updates.lede": "Ứng dụng đã cài kiểm tra GitHub Releases, xác minh bản tải bằng checksum của bản phát hành và cài khi khởi động lại. Tệp và tùy chọn của bạn vẫn nguyên chỗ.",
    "updates.current": "Bản hiện tại",
    "updates.notes": "Ghi chú phát hành",
    "updates.note": "Việc kiểm tra được hiển thị và có thể chạy theo yêu cầu trong Cài đặt → Cập nhật. Bản cập nhật được xác minh bằng checksum, không bằng chứng chỉ ký mã.",

    "faq.kicker": "CÂU HỎI",
    "faq.title": "Trước khi cài đặt.",
    "faq.q1": "Wheel and Form có miễn phí không?",
    "faq.a1": "Có. Ứng dụng theo giấy phép MIT. Bộ cài chưa được ký mã, nên Windows SmartScreen có thể hỏi xác nhận lần chạy đầu.",
    "faq.q2": "Ứng dụng có tải tệp của tôi lên không?",
    "faq.a2": "Không. Chuyển đổi, công cụ và xem trước chạy cục bộ. Ứng dụng liên hệ GitHub để kiểm tra cập nhật; cài engine tùy chọn dùng winget. Tệp của bạn không được gửi tới dịch vụ nào.",
    "faq.q3": "Cần gì để chạy ứng dụng?",
    "faq.a3": "Windows 10 hoặc 11. FFmpeg, Pandoc và 7-Zip được phát hiện tự động. ImageMagick, LibreOffice và Ghostscript thêm tuyến tùy chọn và có thể cài trong Cài đặt → Engine.",
    "faq.q4": "Tôi có thể để kết quả ở chỗ khác không?",
    "faq.a4": "Có. Chọn cạnh tệp gốc, một thư mục bạn chọn, hoặc hỏi mỗi lần. Mặc định là cạnh nguồn.",
    "faq.q5": "Vòng xoay desktop có hoạt động trong Explorer không?",
    "faq.a5": "Có. Bật Vòng xoay desktop trong Cài đặt, rồi bắt đầu kéo tệp bình thường trên desktop hoặc Explorer và giữ Shift, Ctrl hoặc Alt.",
    "faq.q6": "Cập nhật hoạt động thế nào?",
    "faq.a6": "Ứng dụng đã cài kiểm tra GitHub Releases, xác minh checksum của bản tải và đề nghị cài một chạm. Ứng dụng khởi động lại để hoàn tất.",

    "download.kicker": "SẴN SÀNG KHI BẠN",
    "download.title": "Đặt xưởng làm việc lên desktop.",
    "download.lede": "Windows 10 / 11 · bộ cài gốc · ưu tiên cục bộ theo mặc định.",
    "download.button": "Tải bản mới nhất",
    "download.source": "Xem mã nguồn",
    "download.fine": "Giấy phép MIT. Bản chưa ký; SmartScreen có thể hỏi xác nhận.",

    "footer.tagline": "Xưởng xử lý tệp ưu tiên cục bộ cho Windows.",
    "footer.product": "SẢN PHẨM",
    "footer.project": "DỰ ÁN",
    "footer.releases": "Bản phát hành",
    "footer.readme": "README",
    "footer.license": "Giấy phép",
    "footer.language": "NGÔN NGỮ",
    "footer.local": "DÀNH CHO WINDOWS · GIỮ TRÊN MÁY BẠN"
  },

  ja: {
    "meta.title": "Wheel and Form — すべての形式を、ひと回しで。",
    "meta.description": "Windows 向けのローカル優先ファイルワークショップ。303 の変換ルート、26 の専用ツール、システム全体で使えるラジアルホイール。アップロードもアカウントも不要です。",
    "a11y.skip": "コンテンツへスキップ",
    "a11y.language": "言語",
    "brand.tag": "ファイル工房",
    "nav.workbench": "ワークベンチ",
    "nav.formats": "フォーマット",
    "nav.tools": "ツール",
    "nav.desktop": "デスクトップホイール",
    "nav.privacy": "プライバシー",
    "nav.download": "ダウンロード",
    "nav.downloadLabel": "Windows 版 Wheel and Form をダウンロード",

    "hero.eyebrow": "WINDOWS 10 / 11 · ローカル優先ファイルワークショップ",
    "hero.title1": "すべての形式を。",
    "hero.title2": "ひと回しで。",
    "hero.lede": "変換、圧縮、展開、加工を、自分の PC だけで。ドラッグを始めてキーを押し、ホイールで完了。アップロードもアカウントも、他人のクラウド待ちもありません。",
    "hero.download": "Windows 版をダウンロード",
    "hero.explore": "ワークベンチを見る",
    "metric.routes": "変換ルート",
    "metric.formats": "入力 / 出力形式",
    "metric.tools": "専用ツール",
    "metric.uploads": "アップロード",
    "hero.plate": "プレート 01 — ワークベンチ",
    "hero.caption": "3 つのファイル、3 つの保存先。結果は元ファイルの隣に。",
    "alt.hero": "ワークベンチ上に開いた Wheel and Form のラジアルフォーマットホイール",

    "grammar.kicker": "グラマー",
    "grammar.title": "3 つのキー。1 つのホイール。メニューを探さない。",
    "grammar.lede": "Wheel and Form は、いつも使う修飾キーをひとつのファイル言語に変えます。同じホイールがワークベンチでも Windows 全体でも現れます。",
    "grammar.centre": "ローカルワークベンチ",
    "grammar.note": "ホイールはカーソルに追従します。フリックで選び、離して確定。",
    "grammar.formats": "フォーマット",
    "grammar.formatsCopy": "画像、文書、音声、動画、電子書、データ、アーカイブをまたぐ 303 の変換ルート。",
    "grammar.tools": "ツール",
    "grammar.toolsCopy": "切り抜き、注釈、墨消し、圧縮、トリム、正規化、分割、結合、展開など 26 の専用操作。",
    "grammar.actions": "ファイル操作",
    "grammar.actionsCopy": "作業から離れない 6 つのファイル操作：共有/コピー、プレビュー、複製、移動、パスをコピー、ターミナルを開く。",

    "workbench.kicker": "ワークベンチ",
    "workbench.title": "ファイルを落とす。すべての出口が見える。",
    "workbench.lede": "混在したバッチを並べ、ファイルごとに保存先を決めて変換。既定では元ファイルの隣に出力されるので、最初のファイルは動きません。",
    "workbench.bullet1": "画像、PDF、文書、音声、動画、アーカイブを 1 つのキューで。",
    "workbench.bullet2": "ファイルごとの保存先。全体モードを切り替え直す必要はありません。",
    "workbench.bullet3": "実際の進捗、明確なエラー、読める作業ログ。",
    "workbench.bullet4": "仕上がったファイルを、ワークベンチから開く・表示する・共有する。",
    "workbench.note": "元ファイルは上書きしません。すべての操作が新しいファイルを書き出します。",
    "workbench.plate": "プレート 02 — ワークキュー",
    "workbench.caption": "3 ファイルを投入。1 つは変換済み。残りはそれぞれの保存先で待機。",
    "alt.workbench": "Wheel and Form のキューに並ぶ 3 ファイル。1 つの PNG は BMP に変換済み",

    "formats.kicker": "フォーマット索引",
    "formats.title": "同じファイルから、303 の出口。",
    "formats.lede": "53 の入力形式と 39 の出力形式を、ファミリー別にまとめた生きた索引。検索し、絞り込み、ホイールに候補を先回りさせられます。",
    "formats.routes": "変換ルート",
    "formats.inputs": "入力形式",
    "formats.outputs": "出力形式",
    "formats.families": "形式ファミリー",
    "formats.plate": "プレート 03 — 変換索引",
    "formats.caption": "すべてのルートが見えます。ホイールは近道であり、閉ざされた扉ではありません。",
    "alt.formats": "形式ファミリーと出力タイルを並べた Wheel and Form の変換索引",

    "tools.kicker": "ツールベンチ",
    "tools.title": "仕上げに効く、小さな操作。",
    "tools.lede": "最後の仕上げのための 26 の専用ツール。すべてローカルで動き、結果をプレビューし、元ファイルをそのまま残します。",
    "tools.plate": "プレート 04 — 切り抜き",
    "tools.caption": "ライブプレビューで切り抜き。比率と基準を選び、実行。破壊的な編集はありません。",
    "alt.crop": "ライブ画像プレビューと比率コントロールを備えた Wheel and Form の Crop ツール",
    "tools.chip1": "圧縮",
    "tools.chip2": "切り抜き",
    "tools.chip3": "注釈",
    "tools.chip4": "墨消し",
    "tools.chip5": "トリム",
    "tools.chip6": "ミュート",
    "tools.chip7": "正規化",
    "tools.chip8": "スナップショット",
    "tools.chip9": "PDF 分割",
    "tools.chip10": "整理",
    "tools.chip11": "展開",
    "tools.chip12": "PDF 作成",
    "tools.bullet1": "画像、動画、音声、PDF、文書、アーカイブのツールを 1 つのベンチに。",
    "tools.bullet2": "何かを書き出す前にコントロールをプレビュー。",
    "tools.bullet3": "出力は新しい名前で保存。元ファイルはそのまま。",
    "tools.note": "全リストはワークベンチで。26 のツールと対応形式を確認できます。",

    "desktop.kicker": "システム全体",
    "desktop.title": "ホイールはアプリの外までついてきます。",
    "desktop.lede": "Explorer を開き、ファイルのドラッグを開始。Shift、Ctrl、Alt を押すと、カーソル位置にホイールが現れます。保存先を選んで離すだけ。アプリ画面も、コンテキスト切り替えもありません。",
    "desktop.plate": "プレート 05 — 実写 / WINDOWS 11 EXPLORER",
    "desktop.live": "ドラッグ中",
    "desktop.caption": "Explorer での実際のドラッグ。Shift で形式を開き、ホイールでドロップを完了。",
    "alt.desktop": "実際のファイルドラッグ中に Windows Explorer 上へ開いた Wheel and Form のラジアルホイール",
    "desktop.step1": "ドラッグを始める",
    "desktop.step1Copy": "デスクトップまたは Explorer で、いつものようにファイルをつかみます。",
    "desktop.step2": "キーを押す",
    "desktop.step2Copy": "Shift で形式、Ctrl でツール、Alt でファイル操作。",
    "desktop.step3": "ホイールで完了",
    "desktop.step3Copy": "保存先へフリックして離す。出力は元ファイルの隣に。",

    "privacy.kicker": "ローカルの掟",
    "privacy.title": "ファイルが部屋の外に出ることはありません。",
    "privacy.lede": "アカウントなし。アップロードなし。サーバー側のキューなし。変換、ツール、プレビューはすべてこの PC で動きます。通信は、目に見える更新チェックと、自分で開始するエンジンのインストールだけです。",
    "privacy.row1": "元ファイルの隣",
    "privacy.row1Copy": "既定の出力モードは、新しいファイルを元ファイルの隣に書き出します。1 つのフォルダに、整った結果。",
    "privacy.row2": "元ファイルは無傷",
    "privacy.row2Copy": "変換もツールも新しいファイルを書き出します。入力を上書きすることはありません。",
    "privacy.row3": "自分のエンジン",
    "privacy.row3Copy": "検出されたツールを使うか、既存の実行ファイルを指定できます。不足エンジンは任意です。",
    "privacy.row4": "透明な通信",
    "privacy.row4Copy": "GitHub の更新チェックと任意のエンジン導入。ファイルはどちらにも関与しません。",
    "privacy.note": "設定はこの PC の小さな JSON ファイルに保存されます。テレメトリーは送信しません。",
    "privacy.manifesto1": "ファイルは残る。",
    "privacy.manifesto2": "仕事は進む。",
    "privacy.manifestoNote": "アップロードなし。アカウントなし。サーバーキューなし。",
    "privacy.ledgerTitle": "通信の台帳",
    "privacy.ledgerFiles": "ファイル — 送信しません",
    "privacy.ledgerGithub": "GitHub — 更新確認のみ",
    "privacy.ledgerWinget": "winget — 任意のエンジン導入",
    "privacy.plate1": "プレート 06 — 出力",
    "privacy.plate2": "プレート 07 — エンジン",
    "alt.settingsOutput": "「元ファイルの隣」が選択された出力設定",
    "alt.settingsEngines": "FFmpeg、Pandoc、7-Zip が準備完了、任意エンジンが未導入の変換エンジン状態",

    "updates.kicker": "アップデート",
    "updates.title": "新しいビルドは、再起動一回で。",
    "updates.lede": "インストール済みアプリは GitHub Releases を確認し、リリースのチェックサムでダウンロードを検証して、再起動時にインストールします。ファイルと設定はそのままです。",
    "updates.current": "現在のリリース",
    "updates.notes": "リリースノート",
    "updates.note": "確認は表示され、設定 → アップデートから手動でも実行できます。更新はコード署名証明書ではなく、チェックサムで検証されます。",

    "faq.kicker": "質問",
    "faq.title": "インストールの前に。",
    "faq.q1": "Wheel and Form は無料ですか？",
    "faq.a1": "はい。MIT ライセンスです。インストーラーはコード署名されていないため、初回起動時に Windows SmartScreen が確認を求める場合があります。",
    "faq.q2": "ファイルはアップロードされますか？",
    "faq.a2": "いいえ。変換、ツール、プレビューはローカルで動きます。更新確認のため GitHub に接続し、任意のエンジン導入には winget を使います。ファイルが送信されることはありません。",
    "faq.q3": "動作に必要なものは？",
    "faq.a3": "Windows 10 または 11。FFmpeg、Pandoc、7-Zip は自動検出されます。ImageMagick、LibreOffice、Ghostscript は任意のルートを追加し、設定 → エンジンから導入できます。",
    "faq.q4": "出力先を別にできますか？",
    "faq.a4": "はい。元ファイルの隣、選んだフォルダ、毎回確認から選べます。既定は元ファイルの隣です。",
    "faq.q5": "デスクトップホイールは Explorer で使えますか？",
    "faq.a5": "はい。設定でデスクトップホイールを有効にし、デスクトップまたは Explorer で通常どおりファイルをドラッグして Shift、Ctrl、Alt を押します。",
    "faq.q6": "アップデートはどう動きますか？",
    "faq.a6": "インストール済みアプリが GitHub Releases を確認し、ダウンロードのチェックサムを検証して、ワンクリック導入を提案します。再起動で完了します。",

    "download.kicker": "準備ができたら",
    "download.title": "ワークショップをデスクトップに。",
    "download.lede": "Windows 10 / 11 · ネイティブインストーラー · 既定でローカル優先。",
    "download.button": "最新リリースをダウンロード",
    "download.source": "ソースを見る",
    "download.fine": "MIT ライセンス。未署名ビルドのため、SmartScreen が確認を求める場合があります。",

    "footer.tagline": "Windows 向けのローカル優先ファイルワークショップ。",
    "footer.product": "プロダクト",
    "footer.project": "プロジェクト",
    "footer.releases": "リリース",
    "footer.readme": "README",
    "footer.license": "ライセンス",
    "footer.language": "言語",
    "footer.local": "WINDOWS のために · あなたのマシンに"
  }
};

function detectLanguage() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (SUPPORTED.includes(fromUrl)) return fromUrl;
  } catch (_) { /* file:// */ }
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch (_) { /* storage blocked */ }
  const browser = (navigator.language || "en").toLowerCase();
  if (browser.startsWith("vi")) return "vi";
  if (browser.startsWith("ja")) return "ja";
  return "en";
}

function applyLanguage(lang) {
  if (!SUPPORTED.includes(lang)) lang = "en";
  const dict = I18N[lang];
  document.documentElement.lang = lang;

  for (const el of document.querySelectorAll("[data-i18n]")) {
    const value = dict[el.dataset.i18n];
    if (value) el.textContent = value;
  }
  for (const el of document.querySelectorAll("[data-i18n-alt]")) {
    const value = dict[el.dataset.i18nAlt];
    if (value) el.alt = value;
  }
  for (const el of document.querySelectorAll("[data-i18n-aria]")) {
    const value = dict[el.dataset.i18nAria];
    if (value) el.setAttribute("aria-label", value);
  }

  document.title = dict["meta.title"];
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = dict["meta.description"];

  for (const btn of document.querySelectorAll(".lang-switch [data-lang]")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
  }
  for (const btn of document.querySelectorAll(".footer-links [data-lang]")) {
    if (btn.dataset.lang === lang) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  }

  try { localStorage.setItem(LANG_KEY, lang); } catch (_) { /* storage blocked */ }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);
  } catch (_) { /* file:// */ }
}

function wireLanguageButtons() {
  for (const btn of document.querySelectorAll("[data-lang]")) {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
  }
}

async function loadLatestRelease() {
  try {
    const response = await fetch(RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const release = await response.json();
    const tag = release.tag_name || "v0.2.3";
    document.querySelectorAll("[data-version]").forEach((el) => { el.textContent = tag; });

    const installer = (release.assets || []).find((asset) => /setup.*\.exe$/i.test(asset.name));
    if (installer && installer.browser_download_url) {
      document.querySelectorAll("[data-download]").forEach((link) => {
        link.href = installer.browser_download_url;
      });
    }
  } catch (error) {
    document.querySelectorAll("[data-download]").forEach((link) => {
      if (!link.getAttribute("href")) link.href = RELEASES_URL;
    });
  }
}

function wireReveal() {
  const items = document.querySelectorAll(".section h2, .plate, .format-stats, .steps li");
  if (!items.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (const item of items) {
    item.style.opacity = "0";
    item.style.transform = "translateY(10px)";
    item.style.transition = "opacity 420ms cubic-bezier(.16,1,.3,1), transform 420ms cubic-bezier(.16,1,.3,1)";
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.style.opacity = "1";
      entry.target.style.transform = "none";
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

  for (const item of items) observer.observe(item);
}

function init() {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  wireLanguageButtons();
  applyLanguage(detectLanguage());
  wireReveal();
  loadLatestRelease();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
