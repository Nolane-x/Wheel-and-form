'use strict';

/**
 * Wheel and Form conversion registry.
 * Every conversion is described declaratively so the engine can build a safe
 * argv array (never a shell string) for the matching CLI tool.
 */

const CATEGORY_META = {
  image: { label: 'Images', icon: 'images' },
  video: { label: 'Video', icon: 'video' },
  audio: { label: 'Audio', icon: 'audio' },
  pdf: { label: 'PDF', icon: 'pdf' },
  document: { label: 'Documents', icon: 'documents' },
  slides: { label: 'Slides', icon: 'slides' },
  spreadsheet: { label: 'Spreadsheets', icon: 'spreadsheets' },
  subtitle: { label: 'Subtitles', icon: 'subtitles' },
  archive: { label: 'Archives', icon: 'archives' },
  folder: { label: 'Folders', icon: 'documents' }
};

const FORMAT_INFO = {
  jpg: { category: 'image', label: 'JPG' },
  jpeg: { category: 'image', label: 'JPG' },
  png: { category: 'image', label: 'PNG' },
  webp: { category: 'image', label: 'WEBP' },
  heic: { category: 'image', label: 'HEIC' },
  tiff: { category: 'image', label: 'TIFF' },
  tif: { category: 'image', label: 'TIFF' },
  avif: { category: 'image', label: 'AVIF' },
  bmp: { category: 'image', label: 'BMP' },
  svg: { category: 'image', label: 'SVG' },
  gif: { category: 'video', label: 'GIF' },

  mp4: { category: 'video', label: 'MP4' },
  mov: { category: 'video', label: 'MOV' },
  mkv: { category: 'video', label: 'MKV' },
  webm: { category: 'video', label: 'WEBM' },
  avi: { category: 'video', label: 'AVI' },
  wmv: { category: 'video', label: 'WMV' },
  m4v: { category: 'video', label: 'M4V' },

  mp3: { category: 'audio', label: 'MP3' },
  m4a: { category: 'audio', label: 'M4A' },
  wav: { category: 'audio', label: 'WAV' },
  flac: { category: 'audio', label: 'FLAC' },
  ogg: { category: 'audio', label: 'OGG' },
  opus: { category: 'audio', label: 'OPUS' },
  aiff: { category: 'audio', label: 'AIFF' },
  wma: { category: 'audio', label: 'WMA' },
  aac: { category: 'audio', label: 'AAC' },

  pdf: { category: 'pdf', label: 'PDF' },

  docx: { category: 'document', label: 'DOCX' },
  pages: { category: 'document', label: 'PAGES' },
  md: { category: 'document', label: 'MD' },
  markdown: { category: 'document', label: 'MD' },
  txt: { category: 'document', label: 'TXT' },
  html: { category: 'document', label: 'HTML' },
  htm: { category: 'document', label: 'HTML' },
  rtf: { category: 'document', label: 'RTF' },
  odt: { category: 'document', label: 'ODT' },
  epub: { category: 'document', label: 'EPUB' },
  tex: { category: 'document', label: 'TEX' },

  ppt: { category: 'slides', label: 'PPT' },
  pptx: { category: 'slides', label: 'PPTX' },

  xlsx: { category: 'spreadsheet', label: 'XLSX' },
  xls: { category: 'spreadsheet', label: 'XLS' },
  ods: { category: 'spreadsheet', label: 'ODS' },
  csv: { category: 'spreadsheet', label: 'CSV' },
  tsv: { category: 'spreadsheet', label: 'TSV' },

  srt: { category: 'subtitle', label: 'SRT' },
  vtt: { category: 'subtitle', label: 'VTT' },

  zip: { category: 'archive', label: 'ZIP' },
  tar: { category: 'archive', label: 'TAR' },
  gz: { category: 'archive', label: 'GZIP' },
  tgz: { category: 'archive', label: 'TGZ' },
  rar: { category: 'archive', label: 'RAR' },
  '7z': { category: 'archive', label: '7Z' },

  folder: { category: 'folder', label: 'FOLDER' }
};

const IMPORT_ONLY = new Set(['rar', 'ppt', 'xls', 'rtf', 'rtfd', 'textClipping']);

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'tiff', 'tif', 'avif', 'bmp', 'svg'];
const IMAGE_TARGETS = ['jpg', 'png', 'webp', 'heic', 'tiff', 'avif', 'bmp', 'pdf'];
const VIDEO_EXTS = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'wmv'];
const VIDEO_TARGETS = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'gif', 'mp3'];
const AUDIO_EXTS = ['mp3', 'm4a', 'wav', 'flac', 'ogg', 'opus', 'aiff', 'wma'];
const AUDIO_TARGETS = ['mp3', 'm4a', 'wav', 'flac', 'ogg', 'opus', 'aiff', 'wma'];
const DOC_EXTS = ['docx', 'pages', 'md', 'markdown', 'txt', 'html', 'htm', 'rtf', 'odt', 'epub', 'tex'];
const DOC_TARGETS = ['docx', 'pages', 'pdf', 'txt', 'md', 'html', 'epub'];
const SHEET_EXTS = ['xlsx', 'xls', 'ods', 'csv', 'tsv'];
const SHEET_TARGETS = ['xlsx', 'ods', 'csv', 'tsv', 'pdf'];
const SUB_EXTS = ['srt', 'vtt'];
const SUB_TARGETS = ['srt', 'vtt', 'txt'];
const ARCHIVE_EXTS = ['zip', 'tar', 'gz', 'tgz', 'rar', '7z'];
const ARCHIVE_TARGETS = ['zip', 'tar', 'gz', '7z'];

function targetsFor(ext) {
  ext = String(ext || '').toLowerCase();
  let list = [];
  if (IMAGE_EXTS.includes(ext)) list = IMAGE_TARGETS.slice();
  else if (VIDEO_EXTS.includes(ext)) list = VIDEO_TARGETS.slice();
  else if (ext === 'gif') list = VIDEO_TARGETS.filter((e) => e !== 'mp3');
  else if (AUDIO_EXTS.includes(ext)) list = AUDIO_TARGETS.slice();
  else if (ext === 'pdf') list = ['docx', 'pages', 'pptx', 'xlsx', 'jpg', 'png', 'epub', 'txt', 'md'];
  else if (DOC_EXTS.includes(ext)) list = DOC_TARGETS.slice();
  else if (ext === 'ppt' || ext === 'pptx') list = ['pdf', 'jpg', 'png'];
  else if (SHEET_EXTS.includes(ext)) list = SHEET_TARGETS.slice();
  else if (SUB_EXTS.includes(ext)) list = SUB_TARGETS.slice();
  else if (ARCHIVE_EXTS.includes(ext)) list = ARCHIVE_TARGETS.slice();
  else if (ext === 'folder') list = ['zip'];
  return list.filter((e) => e !== ext && !IMPORT_ONLY.has(e));
}

// ---------------------------------------------------------------------------
// Conversion definitions
// ---------------------------------------------------------------------------

function imageArgs() {
  return ['{input}', '{output}'];
}

function videoArgs(out) {
  const base = ['-y', '-i', '{input}'];
  const map = {
    mp4: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'],
    mov: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '192k'],
    mkv: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '192k'],
    webm: ['-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-c:a', 'libopus', '-b:a', '128k'],
    avi: ['-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'libmp3lame', '-b:a', '192k'],
    wmv: ['-c:v', 'wmv2', '-q:v', '5', '-c:a', 'wmav2', '-b:a', '192k'],
    mp3: ['-vn', '-c:a', 'libmp3lame', '-b:a', '192k'],
    gif: ['-vf', 'fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0']
  };
  return [...base, ...(map[out] || []), '{output}'];
}

function audioArgs(out) {
  const base = ['-y', '-i', '{input}', '-vn'];
  const map = {
    mp3: ['-c:a', 'libmp3lame', '-b:a', '192k'],
    m4a: ['-c:a', 'aac', '-b:a', '192k'],
    wav: ['-c:a', 'pcm_s16le'],
    flac: ['-c:a', 'flac'],
    ogg: ['-c:a', 'libvorbis', '-q:a', '5'],
    opus: ['-c:a', 'libopus', '-b:a', '128k'],
    aiff: ['-c:a', 'pcm_s16be'],
    wma: ['-c:a', 'wmav2', '-b:a', '192k'],
    aac: ['-c:a', 'aac', '-b:a', '192k']
  };
  return [...base, ...(map[out] || []), '{output}'];
}

function buildConversion(inputExt, outputExt) {
  const inCat = (FORMAT_INFO[inputExt] || {}).category;
  const id = `${inputExt}-to-${outputExt}`;
  const common = { id, inputExt, outputExt, category: inCat, label: (FORMAT_INFO[outputExt] || {}).label || outputExt.toUpperCase() };

  if (inputExt === 'folder') {
    return { ...common, tool: '7z', special: 'zipFolder', args: [] };
  }

  if (inCat === 'image') {
    return { ...common, tool: 'magick', args: imageArgs(), fallback: ['heic', 'avif', 'tiff', 'svg'].includes(inputExt) ? 'ffmpeg' : null };
  }
  if (inCat === 'video') {
    return { ...common, tool: 'ffmpeg', args: videoArgs(outputExt) };
  }
  if (inCat === 'audio') {
    return { ...common, tool: 'ffmpeg', args: audioArgs(outputExt) };
  }
  if (inCat === 'pdf') {
    if (outputExt === 'jpg' || outputExt === 'png') {
      return { ...common, tool: 'magick', special: 'pdfImages', args: [] };
    }
    if (outputExt === 'pages') {
      return { ...common, outputExt: 'pages', actualExt: 'docx', tool: 'soffice', special: 'sofficeAs', note: 'Pages export is not available on Windows. Saved as DOCX instead.' };
    }
    if (outputExt === 'md' || outputExt === 'epub' || outputExt === 'txt') {
      return { ...common, tool: 'pandoc', special: 'pdfTextTo', args: [] };
    }
    return { ...common, tool: 'soffice', special: 'sofficeAs' };
  }
  if (inCat === 'slides') {
    if (outputExt === 'pdf') return { ...common, tool: 'soffice', special: 'sofficeAs' };
    return { ...common, tool: 'soffice', special: 'docToImages', args: [] };
  }
  if (inCat === 'spreadsheet') {
    return { ...common, tool: 'soffice', special: 'sofficeAs', note: outputExt === 'csv' || outputExt === 'tsv' ? 'LibreOffice exports the active sheet only.' : '' };
  }
  if (inCat === 'subtitle') {
    if (outputExt === 'txt') return { ...common, tool: 'node', special: 'subtitleTxt', args: [] };
    return { ...common, tool: 'ffmpeg', args: ['-y', '-i', '{input}', '{output}'] };
  }
  if (inCat === 'archive') {
    return { ...common, tool: '7z', special: 'repack', args: [] };
  }
  if (inCat === 'document') {
    if (outputExt === 'pdf') return { ...common, tool: 'soffice', special: 'sofficeAs' };
    if (outputExt === 'jpg' || outputExt === 'png') return { ...common, tool: 'soffice', special: 'docToImages', args: [] };
    if (outputExt === 'pages') {
      return { ...common, tool: 'soffice', special: 'sofficeAs', actualExt: 'docx', note: 'Pages export is not available on Windows. Saved as DOCX instead.' };
    }
    if (inputExt === 'rtf' || inputExt === 'odt') {
      return { ...common, tool: 'soffice', special: 'sofficeAs', note: outputExt === 'md' ? 'Converted through plain text.' : '' };
    }
    // Everything else uses pandoc, which reads docx/md/txt/html/epub/tex natively.
    return { ...common, tool: 'pandoc', args: ['{input}', '-o', '{output}'] };
  }
  return { ...common, tool: 'magick', args: imageArgs() };
}

const conversions = [];
const conversionMap = new Map();
for (const ext of Object.keys(FORMAT_INFO)) {
  if (ext === 'folder') continue;
  const outs = targetsFor(ext);
  for (const out of outs) {
    const conv = buildConversion(ext, out);
    conversions.push(conv);
    conversionMap.set(conv.id, conv);
  }
}
{
  const conv = buildConversion('folder', 'zip');
  conversions.push(conv);
  conversionMap.set(conv.id, conv);
}

function findConversion(inputExt, outputExt) {
  inputExt = String(inputExt || '').toLowerCase();
  outputExt = String(outputExt || '').toLowerCase();
  return conversionMap.get(`${inputExt}-to-${outputExt}`) || null;
}

// ---------------------------------------------------------------------------
// Advanced tools (26)
// ---------------------------------------------------------------------------

const opt = {
  range: (key, label, value, min, max, step = 1, suffix = '') => ({ key, label, type: 'range', value, min, max, step, suffix }),
  seg: (key, label, value, options) => ({ key, label, type: 'segmented', value, options }),
  num: (key, label, value, min = 0, max = 86400, step = 1, suffix = 's') => ({ key, label, type: 'number', value, min, max, step, suffix }),
  text: (key, label, value = '', placeholder = '') => ({ key, label, type: 'text', value, placeholder }),
  toggle: (key, label, value = false) => ({ key, label, type: 'toggle', value }),
  files: (key, label, accept, multiple = true) => ({ key, label, type: 'files', value: [], accept, multiple })
};

const TOOLS = [
  {
    id: 'compress', title: 'COMPRESS', name: 'Compress', icon: 'compress',
    desc: 'Shrink a file while keeping the details that matter.',
    kinds: ['image', 'video', 'audio', 'pdf'],
    suffix: ' Compressed',
    options: {
      image: [opt.range('quality', 'Quality', 78, 40, 95, 1, '%')],
      video: [opt.seg('strength', 'Compression', 'balanced', [{ value: 'small', label: 'Smaller' }, { value: 'balanced', label: 'Balanced' }, { value: 'high', label: 'Higher quality' }])],
      audio: [opt.seg('bitrate', 'Bitrate', '128', [{ value: '96', label: '96 kbps' }, { value: '128', label: '128 kbps' }, { value: '192', label: '192 kbps' }])],
      pdf: []
    }
  },
  {
    id: 'removeMetadata', title: 'METADATA', name: 'Remove Metadata', icon: 'removeMetadata',
    desc: 'Strip GPS, camera, author and hidden document data.',
    kinds: ['image', 'video', 'audio', 'pdf'], suffix: ' No Metadata', options: {}
  },
  {
    id: 'editImage', title: 'EDIT', name: 'Edit Image', icon: 'editImage',
    desc: 'Adjust light, color, rotation and mirroring in one pass.',
    kinds: ['image'], suffix: ' Edited',
    options: {
      image: [
        opt.range('exposure', 'Exposure', 0, -2, 2, 0.1, ' EV'),
        opt.range('brightness', 'Brightness', 0, -100, 100, 1, ''),
        opt.range('contrast', 'Contrast', 0, -100, 100, 1, ''),
        opt.range('saturation', 'Saturation', 100, 0, 200, 1, '%'),
        opt.seg('rotate', 'Rotate', '0', ['0', '90', '180', '270'].map((v) => ({ value: v, label: `${v}°` }))),
        opt.toggle('flip', 'Mirror horizontally', false)
      ]
    }
  },
  {
    id: 'annotateImage', title: 'ANNOTATE', name: 'Annotate', icon: 'annotateImage',
    desc: 'Add a clean caption to the top, middle or bottom of an image.',
    kinds: ['image'], suffix: ' Annotated', outputExt: 'png',
    options: {
      image: [
        opt.text('text', 'Caption', '', 'Type a caption…'),
        opt.seg('position', 'Position', 'south', [{ value: 'north', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'south', label: 'Bottom' }]),
        opt.seg('size', 'Size', '42', [{ value: '28', label: 'S' }, { value: '42', label: 'M' }, { value: '64', label: 'L' }]),
        opt.seg('color', 'Color', 'white', [{ value: 'white', label: 'White' }, { value: 'black', label: 'Black' }, { value: '#c9f45a', label: 'Citron' }])
      ]
    }
  },
  {
    id: 'frameImage', title: 'ADD BG', name: 'Add Background', icon: 'frameImage',
    desc: 'Give a photo a clean border or a bold colored matte.',
    kinds: ['image'], suffix: ' Background',
    options: {
      image: [
        opt.seg('color', 'Background', '#ffffff', [{ value: '#ffffff', label: 'White' }, { value: '#f7f6f1', label: 'Paper' }, { value: '#282b29', label: 'Ink' }, { value: '#c9f45a', label: 'Citron' }]),
        opt.range('width', 'Border', 28, 8, 96, 4, 'px')
      ]
    }
  },
  {
    id: 'cropImage', title: 'CROP', name: 'Crop', icon: 'cropImage',
    desc: 'Crop around the center of the frame to a chosen ratio.',
    kinds: ['image'], suffix: ' Cropped',
    options: {
      image: [
        opt.seg('aspect', 'Aspect ratio', '1:1', [{ value: '1:1', label: '1:1' }, { value: '4:3', label: '4:3' }, { value: '16:9', label: '16:9' }, { value: '3:2', label: '3:2' }, { value: '9:16', label: '9:16' }]),
        opt.seg('gravity', 'Anchor', 'center', [{ value: 'center', label: 'Center' }, { value: 'north', label: 'Top' }, { value: 'south', label: 'Bottom' }])
      ]
    }
  },
  {
    id: 'redactImage', title: 'REDACT', name: 'Redact', icon: 'redactImage',
    desc: 'Black out a band of the image for private details.',
    kinds: ['image'], suffix: ' Redacted',
    options: {
      image: [
        opt.seg('position', 'Position', 'center', [{ value: 'north', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'south', label: 'Bottom' }]),
        opt.range('width', 'Width', 80, 30, 100, 5, '%'),
        opt.range('height', 'Height', 20, 10, 60, 5, '%')
      ]
    }
  },
  {
    id: 'normalizeAudio', title: 'NORMALIZE', name: 'Normalize Audio', icon: 'normalizeAudio',
    desc: 'Even out quiet and loud parts with broadcast loudness targets.',
    kinds: ['audio'], suffix: ' Normalized', options: {}
  },
  {
    id: 'muteVideo', title: 'MUTE', name: 'Mute Video', icon: 'muteVideo',
    desc: 'Remove the audio track without re-encoding the picture.',
    kinds: ['video'], suffix: ' Muted', options: {}
  },
  {
    id: 'trimVideo', title: 'TRIM', name: 'Trim Video', icon: 'trimVideo',
    desc: 'Keep just the section of video you need.',
    kinds: ['video'], suffix: ' Trimmed',
    options: { video: [opt.num('start', 'Start', 0, 0, 86400, 0.1, 's'), opt.num('end', 'End (0 = end)', 0, 0, 86400, 0.1, 's')] }
  },
  {
    id: 'splitPDF', title: 'SPLIT', name: 'Split PDF', icon: 'splitPDF',
    desc: 'Explode every page into its own PDF document.',
    kinds: ['pdf'], suffix: ' Pages', folder: true, options: {}
  },
  {
    id: 'organizePDF', title: 'ORGANIZE', name: 'Organize PDF', icon: 'organizePDF',
    desc: 'Reverse or rotate the pages of a PDF in one go.',
    kinds: ['pdf'], suffix: ' Organized', outputExt: 'pdf',
    options: { pdf: [opt.seg('action', 'Change', 'rotate90', [{ value: 'rotate90', label: 'Rotate 90°' }, { value: 'rotate180', label: 'Rotate 180°' }, { value: 'reverse', label: 'Reverse order' }])] }
  },
  {
    id: 'extractArchive', title: 'EXTRACT', name: 'Extract Archive', icon: 'extractArchive',
    desc: 'Unpack ZIP, RAR, 7Z, TAR and GZIP archives into a folder.',
    kinds: ['archive'], suffix: ' Extracted', folder: true, options: {}
  },
  {
    id: 'createPDF', title: 'CREATE PDF', name: 'Create PDF', icon: 'createPDF',
    desc: 'Combine images or documents into a single PDF.',
    kinds: ['image', 'document'], suffix: ' Created', outputExt: 'pdf', multi: true,
    options: { image: [opt.files('extra', 'Add more images', 'image', true)], document: [] }
  },
  {
    id: 'mergePDF', title: 'MERGE PDF', name: 'Merge PDFs', icon: 'mergePDF',
    desc: 'Join this PDF with other PDFs into one document.',
    kinds: ['pdf'], suffix: ' Merged', outputExt: 'pdf', multi: true,
    options: { pdf: [opt.files('extra', 'Add PDFs', 'pdf', true)] }
  },
  {
    id: 'cropVideo', title: 'CROP', name: 'Crop Video', icon: 'cropVideo',
    desc: 'Crop the frame around the center to a new aspect ratio.',
    kinds: ['video'], suffix: ' Cropped',
    options: { video: [opt.seg('aspect', 'Aspect ratio', '1:1', [{ value: '1:1', label: '1:1' }, { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '4:3', label: '4:3' }])] }
  },
  {
    id: 'changeVideoSpeed', title: 'SPEED', name: 'Change Speed', icon: 'changeVideoSpeed',
    desc: 'Speed up or slow down picture and sound together.',
    kinds: ['video'], suffix: ' Speed', outputExt: 'mp4',
    options: { video: [opt.seg('speed', 'Speed', '2', [{ value: '0.5', label: '0.5×' }, { value: '1.5', label: '1.5×' }, { value: '2', label: '2×' }, { value: '4', label: '4×' }])] }
  },
  {
    id: 'joinVideos', title: 'JOIN', name: 'Join Videos', icon: 'joinVideos',
    desc: 'Join this video with other clips into one file.',
    kinds: ['video'], suffix: ' Joined', outputExt: 'mp4', multi: true,
    options: { video: [opt.files('extra', 'Add videos', 'video', true)] }
  },
  {
    id: 'videoSnapshots', title: 'SNAPSHOT', name: 'Snapshots', icon: 'videoSnapshots',
    desc: 'Pull evenly spaced still frames out of a video.',
    kinds: ['video'], suffix: ' Snapshots', folder: true,
    options: { video: [opt.seg('count', 'Frames', '6', [{ value: '4', label: '4' }, { value: '6', label: '6' }, { value: '9', label: '9' }]), opt.seg('format', 'Format', 'png', [{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }])] }
  },
  {
    id: 'splitVideo', title: 'SPLIT', name: 'Split Video', icon: 'splitVideo',
    desc: 'Cut a long video into equal, easy-to-share clips.',
    kinds: ['video'], suffix: ' Clips', folder: true,
    options: { video: [opt.seg('length', 'Clip length', '30', [{ value: '10', label: '10 sec' }, { value: '30', label: '30 sec' }, { value: '60', label: '1 min' }])] }
  },
  {
    id: 'audioToVideo', title: 'VISUALIZE', name: 'Audio to Video', icon: 'audioToVideo',
    desc: 'Turn an audio track into a shareable waveform video.',
    kinds: ['audio'], suffix: ' Visualizer', outputExt: 'mp4', options: {}
  },
  {
    id: 'trimAudio', title: 'TRIM', name: 'Trim Audio', icon: 'trimAudio',
    desc: 'Keep only the part of the track you need.',
    kinds: ['audio'], suffix: ' Trimmed',
    options: { audio: [opt.num('start', 'Start', 0, 0, 86400, 0.1, 's'), opt.num('end', 'End (0 = end)', 0, 0, 86400, 0.1, 's')] }
  },
  {
    id: 'audioChannels', title: 'CHANNELS', name: 'Audio Channels', icon: 'audioChannels',
    desc: 'Convert between mono and stereo.',
    kinds: ['audio'], suffix: ' Mono',
    options: { audio: [opt.seg('channels', 'Channels', '1', [{ value: '1', label: 'Mono' }, { value: '2', label: 'Stereo' }])] }
  },
  {
    id: 'redactAudio', title: 'BLEEP', name: 'Bleep Audio', icon: 'redactAudio',
    desc: 'Silence a section of an audio track.',
    kinds: ['audio'], suffix: ' Bleeped',
    options: { audio: [opt.num('start', 'From', 0, 0, 86400, 0.1, 's'), opt.num('end', 'To', 2, 0, 86400, 0.1, 's')] }
  },
  {
    id: 'redactVideo', title: 'REDACT', name: 'Redact Video', icon: 'redactVideo',
    desc: 'Cover a private region of the picture with a black box.',
    kinds: ['video'], suffix: ' Redacted',
    options: { video: [
      opt.seg('position', 'Position', 'center', [{ value: 'north', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'south', label: 'Bottom' }]),
      opt.range('width', 'Width', 60, 20, 95, 5, '%'),
      opt.range('height', 'Height', 20, 10, 60, 5, '%'),
      opt.num('start', 'From', 0, 0, 86400, 0.1, 's'),
      opt.num('end', 'To (0 = end)', 0, 0, 86400, 0.1, 's')
    ] }
  },
  {
    id: 'createCollage', title: 'COLLAGE', name: 'Create Collage', icon: 'createCollage',
    desc: 'Arrange photos into a clean grid collage.',
    kinds: ['image'], suffix: ' Collage', outputExt: 'png', multi: true,
    options: { image: [opt.files('extra', 'Add images', 'image', true), opt.seg('columns', 'Columns', '2', [{ value: '2', label: '2' }, { value: '3', label: '3' }])] }
  }
];

const TOOL_MAP = new Map(TOOLS.map((t) => [t.id, t]));

function getTool(id) {
  return TOOL_MAP.get(id) || null;
}

function toolsForCategory(category) {
  return TOOLS.filter((t) => t.kinds.includes(category));
}

function optionsFor(tool, category) {
  if (!tool || !tool.options) return [];
  return tool.options[category] || tool.options.image || tool.options.video || tool.options.audio || tool.options.pdf || [];
}

function toolOutputSuffix(tool, options = {}) {
  if (tool.id === 'audioChannels') return options.channels === '2' ? ' Stereo' : ' Mono';
  if (tool.id === 'changeVideoSpeed') return ` Speed ${options.speed || '2'}x`;
  return tool.suffix || ` ${tool.name}`;
}

function toolOutputExt(tool, inputExt, options = {}) {
  if (tool.outputExt) return tool.outputExt;
  if (tool.id === 'extractArchive') return '';
  if (tool.id === 'createPDF' || tool.id === 'mergePDF' || tool.id === 'organizePDF') return 'pdf';
  if (['splitPDF', 'videoSnapshots', 'splitVideo'].includes(tool.id)) return '';
  return inputExt === 'jpeg' ? 'jpg' : inputExt;
}

// ---------------------------------------------------------------------------
// File actions
// ---------------------------------------------------------------------------

const ACTIONS = [
  { id: 'airdrop', title: 'SHARE', name: 'Share', icon: 'share', desc: 'Copy the file so you can paste it into any app.' },
  { id: 'float', title: 'FLOAT', name: 'Float', icon: 'float', desc: 'Keep a live preview above every other window.' },
  { id: 'copy', title: 'COPY', name: 'Copy', icon: 'copy', desc: 'Copy the file itself to the clipboard.' },
  { id: 'move', title: 'MOVE', name: 'Move', icon: 'move', desc: 'Move the file to a folder you pick.' },
  { id: 'copyPath', title: 'COPY PATH', name: 'Copy Path', icon: 'path', desc: 'Copy the full path as plain text.' },
  { id: 'openTerminal', title: 'TERMINAL', name: 'Terminal', icon: 'terminal', desc: 'Open the containing folder in a terminal.' }
];

const IMPORT_NOTES = [
  { formats: 'RAR · PPT · XLS · RTF', note: 'Accepted as input. Those formats are not offered as an output on Windows.' },
  { formats: 'PAGES', note: 'Pages export is not available on Windows. It is saved as a DOCX instead.' }
];

module.exports = {
  CATEGORY_META,
  FORMAT_INFO,
  CATEGORY_EXTS: {
    image: IMAGE_EXTS,
    video: [...VIDEO_EXTS, 'gif'],
    audio: AUDIO_EXTS,
    pdf: ['pdf'],
    document: DOC_EXTS,
    slides: ['ppt', 'pptx'],
    spreadsheet: SHEET_EXTS,
    subtitle: SUB_EXTS,
    archive: ARCHIVE_EXTS,
    folder: ['folder']
  },
  conversions,
  findConversion,
  targetsFor,
  TOOLS,
  TOOL_MAP,
  getTool,
  toolsForCategory,
  optionsFor,
  toolOutputSuffix,
  toolOutputExt,
  ACTIONS,
  IMPORT_NOTES
};
