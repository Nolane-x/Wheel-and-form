'use strict';

/**
 * Conversion engine.
 *
 * Everything runs through external CLI engines installed on the machine
 * (FFmpeg, ImageMagick, LibreOffice, Pandoc, 7-Zip). PDF composition and
 * splitting is handled in-process with pdf-lib so it works with zero setup.
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const { PDFDocument } = require('pdf-lib');

const settings = require('../settings');
const registry = require('./registry');
const pdf = require('./pdf');
const subtitle = require('./subtitle');

const TOOL_LABELS = {
  ffmpeg: 'FFmpeg',
  ffprobe: 'FFmpeg',
  magick: 'ImageMagick',
  pandoc: 'Pandoc',
  soffice: 'LibreOffice',
  '7z': '7-Zip',
  gs: 'Ghostscript'
};

const WINGET_IDS = {
  ffmpeg: 'Gyan.FFmpeg',
  magick: 'ImageMagick.ImageMagick',
  pandoc: 'JohnMacFarlane.Pandoc',
  soffice: 'TheDocumentFoundation.LibreOffice',
  '7z': '7zip.7zip',
  gs: 'ArtifexSoftware.GhostScript'
};

// ---------------------------------------------------------------------------
// Engine discovery
// ---------------------------------------------------------------------------

const pf = process.env.ProgramFiles || 'C:\\Program Files';
const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
const localApp = process.env.LOCALAPPDATA || '';

function firstExisting(paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function fromPath(name) {
  try {
    const res = spawnSync('where.exe', [name], { encoding: 'utf8', windowsHide: true, timeout: 4000 });
    if (res.status === 0 && res.stdout) {
      const line = res.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
      if (line && fs.existsSync(line)) return line;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function findImageMagick() {
  const roots = [pf, pf86].filter(Boolean);
  for (const root of roots) {
    try {
      const entries = fs.readdirSync(root).filter((e) => /^ImageMagick/i.test(e));
      for (const entry of entries) {
        const candidate = path.join(root, entry, 'magick.exe');
        if (fs.existsSync(candidate)) return candidate;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function findGhostscript() {
  const roots = [pf, pf86].filter(Boolean);
  for (const root of roots) {
    try {
      const entries = fs.readdirSync(root).filter((e) => /^gs/i.test(e) || /Ghostscript/i.test(e));
      for (const entry of entries) {
        for (const exe of ['gswin64c.exe', 'gswin32c.exe']) {
          const candidate = path.join(root, entry, 'bin', exe);
          if (fs.existsSync(candidate)) return candidate;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

const locate = {
  ffmpeg: () => firstExisting([
    path.join(__dirname, '..', '..', 'vendor', 'ffmpeg.exe'),
    path.join(localApp, 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe'),
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    path.join(pf, 'ffmpeg', 'bin', 'ffmpeg.exe')
  ]) || fromPath('ffmpeg'),
  ffprobe: () => firstExisting([
    path.join(__dirname, '..', '..', 'vendor', 'ffprobe.exe'),
    path.join(localApp, 'Microsoft', 'WinGet', 'Links', 'ffprobe.exe'),
    'C:\\ffmpeg\\bin\\ffprobe.exe',
    path.join(pf, 'ffmpeg', 'bin', 'ffprobe.exe')
  ]) || fromPath('ffprobe'),
  magick: () => firstExisting([
    path.join(localApp, 'Microsoft', 'WinGet', 'Links', 'magick.exe'),
    path.join(__dirname, '..', '..', 'vendor', 'magick.exe')
  ]) || findImageMagick() || fromPath('magick'),
  pandoc: () => firstExisting([
    path.join(localApp, 'Pandoc', 'pandoc.exe'),
    path.join(pf, 'Pandoc', 'pandoc.exe'),
    path.join(localApp, 'Microsoft', 'WinGet', 'Links', 'pandoc.exe')
  ]) || fromPath('pandoc'),
  soffice: () => firstExisting([
    path.join(pf, 'LibreOffice', 'program', 'soffice.exe'),
    path.join(pf86, 'LibreOffice', 'program', 'soffice.exe')
  ]) || fromPath('soffice'),
  '7z': () => firstExisting([
    path.join(pf, '7-Zip', '7z.exe'),
    path.join(pf86, '7-Zip', '7z.exe'),
    path.join(localApp, 'Microsoft', 'WinGet', 'Links', '7z.exe')
  ]) || fromPath('7z'),
  gs: () => findGhostscript() || fromPath('gswin64c')
};

let statusCache = null;

function getToolStatus(force = false) {
  if (statusCache && !force) return statusCache;
  const custom = settings.get().toolPaths || {};
  const result = {};
  for (const name of Object.keys(locate)) {
    let found = custom[name] && fs.existsSync(custom[name]) ? custom[name] : null;
    if (!found) {
      try {
        found = locate[name]();
      } catch {
        found = null;
      }
    }
    result[name] = { found, ok: Boolean(found), label: TOOL_LABELS[name] || name };
  }
  statusCache = result;
  return result;
}

function refreshTools() {
  statusCache = null;
  return getToolStatus(true);
}

function requireTool(name) {
  const status = getToolStatus();
  const entry = status[name];
  if (!entry || !entry.ok) {
    const err = new Error(`${TOOL_LABELS[name] || name} is required for this action. Install it or point the app at an existing copy.`);
    err.code = 'MISSING_TOOL';
    err.tool = name === 'ffprobe' ? 'ffmpeg' : name;
    throw err;
  }
  return entry.found;
}

// ---------------------------------------------------------------------------
// Process helpers
// ---------------------------------------------------------------------------

function runProcess(exe, args, opts = {}) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(exe, args, {
        cwd: opts.cwd || undefined,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (err) {
      reject(err);
      return;
    }
    let stdout = '';
    let stderr = '';
    const max = 4 * 1024 * 1024;
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch { /* ignore */ }
      const err = new Error('The operation timed out.');
      err.code = 'TIMEOUT';
      reject(err);
    }, opts.timeout || 15 * 60 * 1000);

    child.stdout.on('data', (d) => {
      stdout += d.toString();
      if (stdout.length > max) stdout = stdout.slice(-max);
    });
    child.stderr.on('data', (d) => {
      const text = d.toString();
      stderr += text;
      if (stderr.length > max) stderr = stderr.slice(-max);
      if (opts.onStderr) opts.onStderr(text);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') err.message = `${path.basename(exe)} could not be started.`;
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

function cleanError(stderr, fallback) {
  if (!stderr) return fallback;
  const lines = stderr.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const interesting = lines.filter((l) => !/^ffmpeg version|^built with|^configuration:|^lib(av|sw|postproc)/i.test(l));
  return (interesting.slice(-3).join(' ') || fallback).slice(0, 400);
}

async function exists(file) {
  try {
    await fsp.access(file);
    return true;
  } catch {
    return false;
  }
}

async function waitForFile(file, tries = 40) {
  for (let i = 0; i < tries; i++) {
    if (await exists(file)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function safeBase(name) {
  return String(name || 'File').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim().slice(0, 120) || 'File';
}

function baseNameFor(input) {
  try {
    if (fs.statSync(input).isDirectory()) return path.basename(input);
  } catch {
    /* fall through to a normal file name */
  }
  return path.basename(input, path.extname(input));
}

async function uniquePath(dir, base, suffix = '', ext = '') {
  await fsp.mkdir(dir, { recursive: true });
  const cleanExt = ext ? `.${ext}` : '';
  let candidate = path.join(dir, `${safeBase(base)}${suffix}${cleanExt}`);
  let n = 2;
  while (await exists(candidate)) {
    candidate = path.join(dir, `${safeBase(base)}${suffix} (${n})${cleanExt}`);
    n++;
  }
  return candidate;
}

async function uniqueFolder(dir, base, suffix = '') {
  await fsp.mkdir(dir, { recursive: true });
  let candidate = path.join(dir, `${safeBase(base)}${suffix}`);
  let n = 2;
  while (await exists(candidate)) {
    candidate = path.join(dir, `${safeBase(base)}${suffix} (${n})`);
    n++;
  }
  return candidate;
}

function outputDirFor(input) {
  const s = settings.get();
  if (s.outputMode === 'custom' && s.customFolder) return s.customFolder;
  if (input && fs.existsSync(input) && fs.statSync(input).isDirectory()) return path.dirname(input);
  return path.dirname(input);
}

async function pickFileOutput(input, suffix, ext, ctx) {
  const dir = outputDirFor(input);
  const base = baseNameFor(input);
  if (ctx && typeof ctx.pickSavePath === 'function' && settings.get().outputMode === 'ask') {
    const suggested = path.join(dir, `${base}${suffix}.${ext}`);
    const picked = await ctx.pickSavePath(suggested, ext);
    if (!picked) {
      const err = new Error('Save cancelled.');
      err.code = 'CANCELLED';
      throw err;
    }
    return picked;
  }
  return uniquePath(dir, base, suffix, ext);
}

async function pickFolderOutput(input, suffix) {
  const dir = outputDirFor(input);
  const base = baseNameFor(input);
  return uniqueFolder(dir, base, suffix);
}

function tempDir(prefix = 'tangerine-') {
  return fsp.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function probeDuration(input) {
  try {
    const ffprobe = getToolStatus().ffprobe.found;
    if (!ffprobe) return 0;
    const res = await runProcess(ffprobe, [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', input
    ], { timeout: 20000 });
    const value = parseFloat(String(res.stdout).trim());
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function progressParser(duration, onProgress) {
  if (!onProgress || !duration) return null;
  return (text) => {
    const match = /time=(\d+):(\d+):([\d.]+)/.exec(text);
    if (!match) return;
    const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
    const pct = Math.max(0, Math.min(100, Math.round((seconds / duration) * 100)));
    onProgress(pct);
  };
}

// ---------------------------------------------------------------------------
// Probing
// ---------------------------------------------------------------------------

async function probe(input) {
  const stat = await fsp.stat(input);
  const isDir = stat.isDirectory();
  const ext = isDir ? 'folder' : path.extname(input).slice(1).toLowerCase();
  const info = registry.FORMAT_INFO[ext] || {};
  const result = {
    path: input,
    name: path.basename(input),
    ext,
    kind: isDir ? 'folder' : (info.category || 'other'),
    label: info.label || (isDir ? 'FOLDER' : ext.toUpperCase()),
    size: stat.size,
    isDir,
    width: null,
    height: null,
    duration: 0,
    pages: null,
    hasAudio: false
  };
  if (isDir) {
    try {
      result.entries = fs.readdirSync(input).length;
    } catch { result.entries = 0; }
    return result;
  }
  if (ext === 'pdf') {
    try { result.pages = await pdf.pageCount(input); } catch { result.pages = null; }
    return result;
  }
  const tools = getToolStatus();
  if (['image', 'video', 'audio'].includes(result.kind) && tools.ffprobe.ok) {
    try {
      const res = await runProcess(tools.ffprobe.found, [
        '-v', 'error', '-show_format', '-show_streams', '-of', 'json', input
      ], { timeout: 20000 });
      const data = JSON.parse(res.stdout || '{}');
      const video = (data.streams || []).find((s) => s.codec_type === 'video');
      const audio = (data.streams || []).find((s) => s.codec_type === 'audio');
      if (video) {
        result.width = video.width || null;
        result.height = video.height || null;
      }
      if (data.format && Number.isFinite(parseFloat(data.format.duration))) {
        result.duration = parseFloat(data.format.duration);
      }
      result.hasAudio = Boolean(audio);
    } catch { /* ignore */ }
  } else if (result.kind === 'image' && tools.magick.ok) {
    try {
      const res = await runProcess(tools.magick.found, ['identify', '-format', '%w %h', input], { timeout: 20000 });
      const [w, h] = String(res.stdout).trim().split(/\s+/).map(Number);
      result.width = w || null;
      result.height = h || null;
    } catch { /* ignore */ }
  }
  return result;
}

// ---------------------------------------------------------------------------
// LibreOffice
// ---------------------------------------------------------------------------

async function sofficeConvert(input, targetExt, output, actualExt = targetExt) {
  const soffice = requireTool('soffice');
  const tmp = await tempDir('tangerine-lo-');
  const profile = path.join(tmp, 'profile');
  const outDir = path.join(tmp, 'out');
  await fsp.mkdir(outDir, { recursive: true });
  const profileUrl = `file:///${profile.replace(/\\/g, '/')}`;
  const args = [
    `-env:UserInstallation=${profileUrl}`,
    '--headless', '--norestore', '--nolockcheck', '--nodefault',
    '--convert-to', targetExt,
    '--outdir', outDir,
    input
  ];
  const res = await runProcess(soffice, args, { timeout: 180000 });
  const expected = path.join(outDir, `${path.basename(input, path.extname(input))}.${actualExt}`);
  let found = expected;
  if (!(await waitForFile(expected, 24))) {
    let files = [];
    try { files = await fsp.readdir(outDir); } catch { /* ignore */ }
    const match = files.find((f) => path.extname(f).toLowerCase() === `.${actualExt.toLowerCase()}`);
    if (match) found = path.join(outDir, match);
  }
  if (!(await exists(found))) {
    throw new Error(cleanError(res.stderr, 'LibreOffice could not complete this conversion.'));
  }
  await fsp.mkdir(path.dirname(output), { recursive: true });
  await fsp.copyFile(found, output);
  await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  return output;
}

async function documentToImages(input, outBase, targetExt, ctx) {
  const tmp = await tempDir('tangerine-pages-');
  const tmpPdf = path.join(tmp, 'document.pdf');
  try {
    await sofficeConvert(input, 'pdf', tmpPdf, 'pdf');
    return await rasterizePdf(tmpPdf, outBase, targetExt);
  } finally {
    fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

async function rasterizePdf(input, outBase, targetExt) {
  const magick = getToolStatus().magick.found;
  const gs = getToolStatus().gs.found;
  if (magick) {
    const pattern = `${outBase}-%d.${targetExt}`;
    const args = ['-density', '200', input, '-background', 'white', '-alpha', 'remove', '-alpha', 'off', '-quality', '92', pattern];
    const res = await runProcess(magick, args, { timeout: 5 * 60 * 1000 });
    const dir = path.dirname(outBase);
    const prefix = path.basename(outBase) + '-';
    let files = [];
    try { files = (await fsp.readdir(dir)).filter((f) => f.startsWith(prefix) && path.extname(f).toLowerCase() === `.${targetExt}`); } catch { /* ignore */ }
    if (files.length) return files.map((f) => path.join(dir, f)).sort((a, b) => {
      const na = Number((a.match(/-(\d+)\./) || [])[1] || 0);
      const nb = Number((b.match(/-(\d+)\./) || [])[1] || 0);
      return na - nb;
    });
    if (res.code !== 0 && !gs) {
      // fall through to LibreOffice / error
    }
  }
  throw new Error('Rendering PDF pages needs ImageMagick (with Ghostscript for PDF input). Install them from Settings → Engines.');
}

// ---------------------------------------------------------------------------
// Archive helpers
// ---------------------------------------------------------------------------

async function sevenExtract(input, outDir) {
  const seven = requireTool('7z');
  await fsp.mkdir(outDir, { recursive: true });
  const res = await runProcess(seven, ['x', input, `-o${outDir}`, '-y', '-bso0', '-bsp0'], { timeout: 10 * 60 * 1000 });
  if (res.code !== 0 && !(await fsp.readdir(outDir).catch(() => [])).length) {
    throw new Error(cleanError(res.stderr, 'The archive could not be extracted.'));
  }
  return outDir;
}

async function sevenAdd(format, output, cwd, entries) {
  const seven = requireTool('7z');
  const res = await runProcess(seven, ['a', `-t${format}`, '-y', '-bso0', '-bsp0', output, ...entries], { cwd, timeout: 15 * 60 * 1000 });
  if (res.code !== 0 || !(await exists(output))) {
    throw new Error(cleanError(res.stderr, 'The archive could not be created.'));
  }
  return output;
}

async function repackArchive(input, targetExt, output) {
  const seven = requireTool('7z');
  const tmp = await tempDir('tangerine-arc-');
  try {
    await sevenExtract(input, tmp);
    const entries = await fsp.readdir(tmp);
    if (!entries.length) throw new Error('The archive is empty.');
    if (targetExt === 'gz') {
      const file = await findFirstFile(tmp);
      if (!file) throw new Error('GZIP needs a single file inside the archive.');
      await sevenAdd('gzip', output, path.dirname(file), [path.basename(file)]);
      return output;
    }
    const format = targetExt === 'tgz' ? 'tgz' : targetExt;
    await sevenAdd(format, output, tmp, ['.']);
    return output;
  } finally {
    fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

async function findFirstFile(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile()) return full;
    if (entry.isDirectory()) {
      const nested = await findFirstFile(full);
      if (nested) return nested;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

async function convert(input, targetExt, ctx = {}, onProgress) {
  const job = { input, targetExt, ctx, onProgress };
  let srcExt = path.extname(input).slice(1).toLowerCase();
  try {
    if (fs.statSync(input).isDirectory()) srcExt = 'folder';
  } catch {
    /* a missing file will surface a clearer error below */
  }
  const def = registry.findConversion(srcExt, targetExt);
  if (!def) throw new Error(`No conversion is available from ${srcExt.toUpperCase()} to ${targetExt.toUpperCase()}.`);
  return executeConversion(job, def);
}

async function executeConversion(job, def) {
  const { input, ctx, onProgress } = job;
  const targetExt = job.targetExt;
  const base = baseNameFor(input);
  const noSuffix = `${base}`;

  if (def.special === 'zipFolder') {
    requireTool('7z');
    const output = await pickFileOutput(input, '', 'zip', ctx);
    return finish(await sevenAdd('zip', output, path.dirname(input), [path.basename(input)]), { output });
  }

  if (def.special === 'sofficeAs') {
    requireTool('soffice');
    const actualExt = def.actualExt || targetExt;
    const output = await pickFileOutput(input, '', actualExt, ctx);
    await sofficeConvert(input, actualExt, output, actualExt);
    return finish(output, { output, note: def.note });
  }

  if (def.special === 'docToImages') {
    requireTool('soffice');
    const folder = await pickFolderOutput(input, ` ${targetExt.toUpperCase()}`);
    const outputs = await documentToImages(input, path.join(folder, base), targetExt, ctx);
    return finish(outputs[0], { output: outputs[0], outputs, folder, count: outputs.length });
  }

  if (def.special === 'pdfImages') {
    requireTool('magick');
    const folder = await pickFolderOutput(input, ' Images');
    const outputs = await rasterizePdf(input, path.join(folder, base), targetExt);
    return finish(outputs[0], { output: outputs[0], outputs, folder, count: outputs.length });
  }

  if (def.special === 'pdfTextTo') {
    const tmp = await tempDir('tangerine-pdf-');
    try {
      const txt = path.join(tmp, `${base}.txt`);
      const status = getToolStatus();
      if (status.gs.found) {
        const res = await runProcess(status.gs.found, [
          '-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=txtwrite',
          `-sOutputFile=${txt}`, input
        ], { timeout: 180000 });
        if (res.code !== 0 || !(await exists(txt))) {
          throw new Error(cleanError(res.stderr, 'Ghostscript could not extract text from this PDF.'));
        }
      } else if (status.soffice.found) {
        await sofficeConvert(input, 'txt', txt, 'txt');
      } else {
        requireTool('gs');
      }

      if (targetExt === 'txt' || targetExt === 'md') {
        const output = await pickFileOutput(input, '', targetExt, ctx);
        const text = await fsp.readFile(txt, 'utf8');
        await fsp.writeFile(output, text, 'utf8');
        return finish(output, { output });
      }

      requireTool('pandoc');
      const output = await pickFileOutput(input, '', 'epub', ctx);
      const pandoc = getToolStatus().pandoc.found;
      const res = await runProcess(pandoc, [txt, '-o', output], { timeout: 120000 });
      if (res.code !== 0 || !(await exists(output))) {
        throw new Error(cleanError(res.stderr, 'Pandoc could not create the EPUB.'));
      }
      return finish(output, { output });
    } finally {
      fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
    }
  }

  if (def.special === 'subtitleTxt') {
    const output = await pickFileOutput(input, '', 'txt', ctx);
    await subtitle.toTxt(input, output);
    return finish(output, { output });
  }

  if (def.special === 'repack') {
    requireTool('7z');
    const output = await pickFileOutput(input, '', targetExt === 'tgz' ? 'tgz' : targetExt, ctx);
    if (targetExt === 'tgz') {
      const tmp = await tempDir('tangerine-tgz-');
      try {
        await sevenExtract(input, tmp);
        await sevenAdd('tgz', output, tmp, ['.']);
      } finally {
        fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
      }
    } else {
      await repackArchive(input, targetExt, output);
    }
    return finish(output, { output });
  }

  if (def.tool === 'soffice') {
    requireTool('soffice');
    const output = await pickFileOutput(input, '', targetExt, ctx);
    await sofficeConvert(input, targetExt, output, targetExt);
    return finish(output, { output, note: def.note });
  }

  if (def.tool === 'pandoc') {
    requireTool('pandoc');
    const output = await pickFileOutput(input, '', targetExt === 'markdown' ? 'md' : targetExt, ctx);
    const pandoc = getToolStatus().pandoc.found;
    const res = await runProcess(pandoc, [input, '-o', output], { timeout: 180000 });
    if (res.code !== 0 || !(await exists(output))) {
      throw new Error(cleanError(res.stderr, 'Pandoc could not complete this conversion.'));
    }
    return finish(output, { output, note: def.note });
  }

  if (def.tool === 'magick') {
    const status = getToolStatus();
    const ffmpegTarget = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff', 'gif'].includes(String(targetExt).toLowerCase());
    const ffmpegFallback = status.ffmpeg.ok && ffmpegTarget;
    if (!status.magick.ok && !ffmpegFallback) requireTool('magick');
    const output = await pickFileOutput(input, '', targetExt, ctx);
    let res = null;
    if (status.magick.ok) {
      res = await runProcess(status.magick.found, [input, '-auto-orient', output], { timeout: 180000 });
      if (res.code === 0 && (await exists(output))) return finish(output, { output });
    }
    if (ffmpegFallback) {
      const retry = await runProcess(status.ffmpeg.found, ['-y', '-i', input, output], { timeout: 5 * 60 * 1000 });
      if (retry.code === 0 && (await exists(output))) return finish(output, { output });
      if (!status.magick.ok) throw new Error(cleanError(retry.stderr, 'FFmpeg could not convert this image.'));
    }
    throw new Error(cleanError(res && res.stderr, 'ImageMagick could not read this image.'));
  }

  if (def.tool === 'ffmpeg') {
    requireTool('ffmpeg');
    const output = await pickFileOutput(input, '', targetExt, ctx);
    const ffmpeg = getToolStatus().ffmpeg.found;
    const needsProgress = ['video', 'audio'].includes(def.category);
    let duration = 0;
    if (needsProgress) duration = await probeDuration(input);
    const args = def.args.map((a) => String(a).replaceAll('{input}', input).replaceAll('{output}', output));
    const res = await runProcess(ffmpeg, args, { timeout: 30 * 60 * 1000, onStderr: progressParser(duration, onProgress) });
    if (res.code !== 0 || !(await exists(output))) {
      throw new Error(cleanError(res.stderr, 'FFmpeg could not complete this conversion.'));
    }
    return finish(output, { output });
  }

  throw new Error('This conversion is not supported yet.');
}

async function finish(output, extra = {}) {
  return { ok: true, output, ...extra };
}

// ---------------------------------------------------------------------------
// Advanced tools
// ---------------------------------------------------------------------------

async function identify(input) {
  const status = getToolStatus();
  if (status.ffprobe.ok) {
    try {
      const res = await runProcess(status.ffprobe.found, [
        '-v', 'error', '-show_streams', '-show_format', '-of', 'json', input
      ], { timeout: 20000 });
      const data = JSON.parse(res.stdout || '{}');
      const v = (data.streams || []).find((s) => s.codec_type === 'video');
      const a = (data.streams || []).find((s) => s.codec_type === 'audio');
      return {
        width: v ? v.width : null,
        height: v ? v.height : null,
        duration: data.format ? parseFloat(data.format.duration) || 0 : 0,
        hasAudio: Boolean(a)
      };
    } catch { /* ignore */ }
  }
  if (status.magick.ok) {
    try {
      const res = await runProcess(status.magick.found, ['identify', '-format', '%w %h', input], { timeout: 20000 });
      const [w, h] = String(res.stdout).trim().split(/\s+/).map(Number);
      return { width: w || null, height: h || null, duration: 0, hasAudio: false };
    } catch { /* ignore */ }
  }
  return { width: null, height: null, duration: 0, hasAudio: false };
}

async function runMagick(args, timeout = 10 * 60 * 1000) {
  const magick = requireTool('magick');
  const res = await runProcess(magick, args, { timeout });
  if (res.code !== 0) throw new Error(cleanError(res.stderr, 'ImageMagick could not complete this action.'));
  return res;
}

async function runFfmpeg(args, onProgress, timeout = 30 * 60 * 1000) {
  const ffmpeg = requireTool('ffmpeg');
  const res = await runProcess(ffmpeg, ['-hide_banner', ...args], { timeout, onStderr: onProgress });
  if (res.code !== 0) throw new Error(cleanError(res.stderr, 'FFmpeg could not complete this action.'));
  return res;
}

function codecFor(ext, bitrate = '192k') {
  const map = {
    mp3: ['-c:a', 'libmp3lame', '-b:a', bitrate],
    m4a: ['-c:a', 'aac', '-b:a', bitrate],
    wav: ['-c:a', 'pcm_s16le'],
    flac: ['-c:a', 'flac'],
    ogg: ['-c:a', 'libvorbis', '-q:a', '5'],
    opus: ['-c:a', 'libopus', '-b:a', '128k'],
    aiff: ['-c:a', 'pcm_s16be'],
    wma: ['-c:a', 'wmav2', '-b:a', bitrate],
    aac: ['-c:a', 'aac', '-b:a', bitrate]
  };
  return map[ext] || ['-c:a', 'aac', '-b:a', bitrate];
}

async function stripPdfMetadata(input, output) {
  const bytes = await fsp.readFile(input);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const clean = await PDFDocument.create();
  const pages = await clean.copyPages(src, src.getPageIndices());
  pages.forEach((p) => clean.addPage(p));
  await fsp.writeFile(output, await clean.save());
  return output;
}

async function runTool(input, toolId, options = {}, ctx = {}, onProgress) {
  const tool = registry.getTool(toolId);
  if (!tool) throw new Error('Unknown tool.');
  const ext = path.extname(input).slice(1).toLowerCase();
  const info = await probe(input);
  const kind = info.kind;
  if (!tool.kinds.includes(kind)) throw new Error(`This tool is not available for ${kind} files.`);
  const suffix = registry.toolOutputSuffix(tool, options);
  const base = path.basename(input, path.extname(input));
  const outExt = registry.toolOutputExt(tool, ext, options);
  const extra = Array.isArray(options.extra) ? options.extra.filter(Boolean) : [];
  const pct = onProgress || (() => {});

  switch (toolId) {
    case 'compress': {
      if (kind === 'image') {
        const output = await pickFileOutput(input, suffix, ext === 'jpeg' ? 'jpg' : ext, ctx);
        const quality = Number(options.quality ?? 78);
        await runMagick([input, '-auto-orient', '-strip', '-quality', String(quality), output]);
        return finish(output, { output });
      }
      if (kind === 'video') {
        const output = await pickFileOutput(input, suffix, ext, ctx);
        const crf = options.strength === 'small' ? 30 : options.strength === 'high' ? 22 : 26;
        const duration = await probeDuration(input);
        await runFfmpeg(['-y', '-i', input, '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-c:a', 'aac', '-b:a', '128k', output], progressParser(duration, pct));
        return finish(output, { output });
      }
      if (kind === 'audio') {
        const output = await pickFileOutput(input, suffix, ext, ctx);
        const bitrate = `${options.bitrate || '128'}k`;
        await runFfmpeg(['-y', '-i', input, '-vn', ...codecFor(ext, bitrate), output]);
        return finish(output, { output });
      }
      if (kind === 'pdf') {
        const gs = getToolStatus().gs;
        if (gs.ok) {
          const output = await pickFileOutput(input, suffix, 'pdf', ctx);
          const res = await runProcess(gs.found, ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5', '-dPDFSETTINGS=/ebook', '-dNOPAUSE', '-dQUIET', '-dBATCH', `-sOutputFile=${output}`, input], { timeout: 10 * 60 * 1000 });
          if (res.code === 0 && (await exists(output))) return finish(output, { output });
        }
        const output = await pickFileOutput(input, suffix, 'pdf', ctx);
        await stripPdfMetadata(input, output);
        return finish(output, { output, note: 'Install Ghostscript for stronger PDF compression.' });
      }
      break;
    }

    case 'removeMetadata': {
      if (kind === 'image') {
        const output = await pickFileOutput(input, suffix, ext === 'jpeg' ? 'jpg' : ext, ctx);
        await runMagick([input, '-auto-orient', '-strip', output]);
        return finish(output, { output });
      }
      if (kind === 'video' || kind === 'audio') {
        const output = await pickFileOutput(input, suffix, ext, ctx);
        await runFfmpeg(['-y', '-i', input, '-map_metadata', '-1', '-c', 'copy', output]);
        return finish(output, { output });
      }
      if (kind === 'pdf') {
        const output = await pickFileOutput(input, suffix, 'pdf', ctx);
        await stripPdfMetadata(input, output);
        return finish(output, { output });
      }
      break;
    }

    case 'editImage': {
      const output = await pickFileOutput(input, suffix, 'png', ctx);
      const args = [input, '-auto-orient'];
      const exposure = Number(options.exposure || 0);
      if (exposure !== 0) args.push('-evaluate', 'multiply', String(Math.pow(2, exposure)));
      const sat = Number(options.saturation ?? 100);
      if (sat !== 100) args.push('-modulate', `100,${sat},100`);
      const brightness = Number(options.brightness || 0);
      const contrast = Number(options.contrast || 0);
      if (brightness || contrast) args.push('-brightness-contrast', `${brightness}x${contrast}`);
      const rotate = Number(options.rotate || 0);
      if (rotate) args.push('-rotate', String(rotate));
      if (options.flip) args.push('-flop');
      args.push(output);
      await runMagick(args);
      return finish(output, { output });
    }

    case 'annotateImage': {
      const output = await pickFileOutput(input, suffix, 'png', ctx);
      const text = String(options.text || '').trim();
      if (!text) throw new Error('Type a caption first.');
      const position = options.position || 'south';
      const size = options.size || '42';
      const color = options.color || 'white';
      const gravity = position === 'north' ? 'north' : position === 'center' ? 'center' : 'south';
      const offset = position === 'north' ? '+0+48' : position === 'south' ? '+0+48' : '+0+0';
      const under = color === 'black' ? '#ffffffa0' : '#00000080';
      await runMagick([
        input, '-auto-orient', '-gravity', gravity, '-font', 'Arial',
        '-pointsize', size, '-fill', color, '-undercolor', under,
        '-annotate', offset, text, output
      ]);
      return finish(output, { output });
    }

    case 'frameImage': {
      const output = await pickFileOutput(input, suffix, ext === 'jpeg' ? 'jpg' : ext, ctx);
      const width = Number(options.width || 28);
      const color = options.color || '#ffffff';
      await runMagick([input, '-auto-orient', '-bordercolor', color, '-border', `${width}x${width}`, output]);
      return finish(output, { output });
    }

    case 'cropImage': {
      const dims = await identify(input);
      if (!dims.width || !dims.height) throw new Error('Could not read the image dimensions.');
      const [rw, rh] = String(options.aspect || '1:1').split(':').map(Number);
      const ratio = rw / rh;
      let cw = dims.width;
      let ch = Math.round(dims.width / ratio);
      if (ch > dims.height) {
        ch = dims.height;
        cw = Math.round(dims.height * ratio);
      }
      const gravity = options.gravity === 'north' ? 'North' : options.gravity === 'south' ? 'South' : 'Center';
      const output = await pickFileOutput(input, suffix, ext === 'jpeg' ? 'jpg' : ext, ctx);
      await runMagick([input, '-auto-orient', '-gravity', gravity, '-crop', `${cw}x${ch}+0+0`, '+repage', output]);
      return finish(output, { output });
    }

    case 'redactImage': {
      const dims = await identify(input);
      if (!dims.width || !dims.height) throw new Error('Could not read the image dimensions.');
      const w = Math.round((dims.width * Number(options.width || 80)) / 100);
      const h = Math.round((dims.height * Number(options.height || 20)) / 100);
      const x = Math.round((dims.width - w) / 2);
      const y = options.position === 'north' ? Math.round(dims.height * 0.06) : options.position === 'south' ? dims.height - h - Math.round(dims.height * 0.06) : Math.round((dims.height - h) / 2);
      const output = await pickFileOutput(input, suffix, ext === 'jpeg' ? 'jpg' : ext, ctx);
      await runMagick([input, '-auto-orient', '-fill', 'black', '-draw', `rectangle ${x},${y} ${x + w},${y + h}`, output]);
      return finish(output, { output });
    }

    case 'normalizeAudio': {
      const output = await pickFileOutput(input, suffix, ext, ctx);
      await runFfmpeg(['-y', '-i', input, '-vn', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', ...codecFor(ext, '192k'), output]);
      return finish(output, { output });
    }

    case 'muteVideo': {
      const output = await pickFileOutput(input, suffix, ext, ctx);
      await runFfmpeg(['-y', '-i', input, '-an', '-c:v', 'copy', output]);
      return finish(output, { output });
    }

    case 'trimVideo': {
      const start = Number(options.start || 0);
      const end = Number(options.end || 0);
      const output = await pickFileOutput(input, suffix, ext, ctx);
      const duration = await probeDuration(input);
      const args = ['-y'];
      if (start > 0) args.push('-ss', String(start));
      args.push('-i', input);
      if (end > start) args.push('-to', String(end - start));
      args.push('-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', output);
      await runFfmpeg(args, progressParser(end > start ? end - start : Math.max(1, duration - start), pct));
      return finish(output, { output });
    }

    case 'splitPDF': {
      const folder = await pickFolderOutput(input, suffix);
      const outputs = await pdf.split(input, folder, base);
      return finish(outputs[0], { output: outputs[0], outputs, folder, count: outputs.length });
    }

    case 'organizePDF': {
      const output = await pickFileOutput(input, suffix, 'pdf', ctx);
      await pdf.organize(input, output, options.action || 'rotate90');
      return finish(output, { output });
    }

    case 'extractArchive': {
      const folder = await pickFolderOutput(input, suffix);
      await sevenExtract(input, folder);
      const entries = await fsp.readdir(folder);
      return finish(folder, { output: folder, folder, count: entries.length, isFolder: true });
    }

    case 'createPDF': {
      const output = await pickFileOutput(input, suffix, 'pdf', ctx);
      if (kind === 'document') {
        const tmp = await tempDir('tangerine-createpdf-');
        try {
          const tmpPdf = path.join(tmp, 'doc.pdf');
          await sofficeConvert(input, 'pdf', tmpPdf, 'pdf');
          await pdf.merge([tmpPdf], output);
        } finally {
          fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
        }
        return finish(output, { output });
      }
      const prepared = [];
      const tmp = await tempDir('tangerine-createpdf-');
      try {
        for (const file of [input, ...extra]) {
          const e = path.extname(file).toLowerCase();
          if (e === '.jpg' || e === '.jpeg' || e === '.png') {
            prepared.push(file);
          } else if (e === '.pdf') {
            prepared.push(file);
          } else {
            const png = path.join(tmp, `${prepared.length}.png`);
            try {
              await runMagick([file, '-auto-orient', png]);
            } catch {
              await runFfmpeg(['-y', '-i', file, png]);
            }
            prepared.push(png);
          }
        }
        const images = [];
        const pdfs = [];
        for (const file of prepared) {
          if (path.extname(file).toLowerCase() === '.pdf') pdfs.push(file);
          else images.push(file);
        }
        if (pdfs.length) {
          const imagePdf = path.join(tmp, 'images.pdf');
          if (images.length) await pdf.create(images, imagePdf);
          await pdf.merge(images.length ? [imagePdf, ...pdfs] : pdfs, output);
        } else {
          await pdf.create(images, output);
        }
      } finally {
        fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
      }
      return finish(output, { output });
    }

    case 'mergePDF': {
      const files = [input, ...extra.filter((f) => path.extname(f).toLowerCase() === '.pdf')];
      if (files.length < 2) throw new Error('Add at least one more PDF.');
      const output = await pickFileOutput(input, suffix, 'pdf', ctx);
      await pdf.merge(files, output);
      return finish(output, { output, count: files.length });
    }

    case 'cropVideo': {
      const dims = await identify(input);
      if (!dims.width || !dims.height) throw new Error('Could not read the video dimensions.');
      const [rw, rh] = String(options.aspect || '1:1').split(':').map(Number);
      const ratio = rw / rh;
      let cw = dims.width;
      let ch = Math.round(dims.width / ratio);
      if (ch > dims.height) {
        ch = dims.height;
        cw = Math.round(dims.height * ratio);
      }
      cw -= cw % 2;
      ch -= ch % 2;
      const x = Math.round((dims.width - cw) / 2);
      const y = Math.round((dims.height - ch) / 2);
      const output = await pickFileOutput(input, suffix, ext, ctx);
      const duration = dims.duration;
      await runFfmpeg(['-y', '-i', input, '-vf', `crop=${cw}:${ch}:${x}:${y}`, '-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', output], progressParser(duration, pct));
      return finish(output, { output });
    }

    case 'changeVideoSpeed': {
      const speed = Number(options.speed || 2);
      const dims = await identify(input);
      const output = await pickFileOutput(input, suffix, 'mp4', ctx);
      const filters = [`[0:v]setpts=PTS/${speed}[v]`];
      const args = ['-y', '-i', input];
      if (dims.hasAudio) {
        const chain = [];
        let remaining = speed;
        while (remaining > 2) { chain.push('atempo=2'); remaining /= 2; }
        chain.push(`atempo=${remaining}`);
        filters.push(`[0:a]${chain.join(',')}[a]`);
        args.push('-filter_complex', filters.join(';'), '-map', '[v]', '-map', '[a]');
      } else {
        args.push('-filter_complex', filters.join(';'), '-map', '[v]');
      }
      args.push('-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', output);
      await runFfmpeg(args, progressParser(dims.duration / speed, pct));
      return finish(output, { output });
    }

    case 'joinVideos': {
      const files = [input, ...extra];
      if (files.length < 2) throw new Error('Add at least one more video.');
      const output = await pickFileOutput(input, suffix, 'mp4', ctx);
      const tmp = await tempDir('tangerine-join-');
      try {
        const list = path.join(tmp, 'list.txt');
        await fsp.writeFile(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
        let res = await runProcess(requireTool('ffmpeg'), ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', output], { timeout: 30 * 60 * 1000 });
        if (res.code !== 0 || !(await exists(output))) {
          const converted = [];
          for (let i = 0; i < files.length; i++) {
            const normalized = path.join(tmp, `part-${i}.mp4`);
            await runFfmpeg(['-y', '-i', files[i], '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1', '-r', '30', '-c:v', 'libx264', '-crf', '22', '-c:a', 'aac', normalized], null);
            converted.push(normalized);
          }
          await fsp.writeFile(list, converted.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
          res = await runProcess(requireTool('ffmpeg'), ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', output], { timeout: 30 * 60 * 1000 });
          if (res.code !== 0) throw new Error(cleanError(res.stderr, 'The videos could not be joined.'));
        }
      } finally {
        fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
      }
      return finish(output, { output, count: files.length });
    }

    case 'videoSnapshots': {
      const count = Number(options.count || 6);
      const outExt = options.format || 'png';
      const dims = await identify(input);
      const duration = dims.duration || (await probeDuration(input));
      if (!duration) throw new Error('Could not read the video duration.');
      const folder = await pickFolderOutput(input, suffix);
      await fsp.mkdir(folder, { recursive: true });
      const outputs = [];
      for (let i = 0; i < count; i++) {
        const t = (duration / (count + 1)) * (i + 1);
        const out = path.join(folder, `${base} ${i + 1}.${outExt}`);
        await runFfmpeg(['-y', '-ss', String(t), '-i', input, '-frames:v', '1', '-q:v', '2', out], null);
        if (await exists(out)) outputs.push(out);
        pct(Math.round(((i + 1) / count) * 100));
      }
      return finish(outputs[0], { output: outputs[0], outputs, folder, count: outputs.length });
    }

    case 'splitVideo': {
      const length = Number(options.length || 30);
      const folder = await pickFolderOutput(input, suffix);
      await fsp.mkdir(folder, { recursive: true });
      const ffmpeg = requireTool('ffmpeg');
      const outExt = ext === 'gif' ? 'mp4' : ext;
      const pattern = path.join(folder, `${base} %03d.${outExt}`);
      let res = await runProcess(ffmpeg, ['-y', '-i', input, '-f', 'segment', '-segment_time', String(length), '-reset_timestamps', '1', '-c', 'copy', pattern], { timeout: 30 * 60 * 1000 });
      let outputs = (await fsp.readdir(folder)).filter((f) => f.startsWith(`${base} `)).map((f) => path.join(folder, f));
      if (!outputs.length) {
        res = await runProcess(ffmpeg, ['-y', '-i', input, '-f', 'segment', '-segment_time', String(length), '-reset_timestamps', '1', '-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', pattern], { timeout: 30 * 60 * 1000 });
        outputs = (await fsp.readdir(folder)).filter((f) => f.startsWith(`${base} `)).map((f) => path.join(folder, f));
      }
      if (!outputs.length) throw new Error(cleanError(res.stderr, 'The video could not be split.'));
      outputs.sort();
      return finish(outputs[0], { output: outputs[0], outputs, folder, count: outputs.length });
    }

    case 'audioToVideo': {
      const output = await pickFileOutput(input, suffix, 'mp4', ctx);
      const duration = await probeDuration(input);
      await runFfmpeg([
        '-y', '-i', input,
        '-filter_complex', '[0:a]showwaves=s=1280x720:mode=line:colors=0xF35B28,format=yuv420p[v]',
        '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-shortest', output
      ], progressParser(duration, pct));
      return finish(output, { output });
    }

    case 'trimAudio': {
      const start = Number(options.start || 0);
      const end = Number(options.end || 0);
      const output = await pickFileOutput(input, suffix, ext, ctx);
      const args = ['-y'];
      if (start > 0) args.push('-ss', String(start));
      args.push('-i', input);
      if (end > start) args.push('-to', String(end - start));
      args.push('-vn', ...codecFor(ext, '192k'), output);
      const duration = await probeDuration(input);
      await runFfmpeg(args, progressParser(end > start ? end - start : Math.max(1, duration - start), pct));
      return finish(output, { output });
    }

    case 'audioChannels': {
      const channels = Number(options.channels || 1);
      const output = await pickFileOutput(input, suffix, ext, ctx);
      await runFfmpeg(['-y', '-i', input, '-vn', '-ac', String(channels), ...codecFor(ext, '192k'), output]);
      return finish(output, { output });
    }

    case 'redactAudio': {
      const start = Number(options.start || 0);
      const end = Number(options.end || 2);
      if (end <= start) throw new Error('The end time must be after the start time.');
      const output = await pickFileOutput(input, suffix, ext, ctx);
      await runFfmpeg(['-y', '-i', input, '-vn', '-af', `volume=enable='between(t,${start},${end})':volume=0`, ...codecFor(ext, '192k'), output]);
      return finish(output, { output });
    }

    case 'redactVideo': {
      const dims = await identify(input);
      if (!dims.width || !dims.height) throw new Error('Could not read the video dimensions.');
      const w = Math.round((dims.width * Number(options.width || 60)) / 100);
      const h = Math.round((dims.height * Number(options.height || 20)) / 100);
      const x = Math.round((dims.width - w) / 2);
      const y = options.position === 'north' ? Math.round(dims.height * 0.06) : options.position === 'south' ? dims.height - h - Math.round(dims.height * 0.06) : Math.round((dims.height - h) / 2);
      const start = Number(options.start || 0);
      const end = Number(options.end || 0);
      const enable = end > start ? `:enable='between(t,${start},${end})'` : '';
      const output = await pickFileOutput(input, suffix, ext, ctx);
      await runFfmpeg([
        '-y', '-i', input,
        '-vf', `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=black@1:t=fill${enable}`,
        '-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', output
      ], progressParser(dims.duration, pct));
      return finish(output, { output });
    }

    case 'createCollage': {
      const files = [input, ...extra];
      if (files.length < 2) throw new Error('Add at least one more image.');
      const cols = Number(options.columns || 2);
      const output = await pickFileOutput(input, suffix, 'png', ctx);
      await runMagick(['montage', ...files, '-auto-orient', '-tile', `${cols}x`, '-geometry', '+16+16', '-background', '#ffffff', output]);
      return finish(output, { output, count: files.length });
    }

    default:
      break;
  }
  throw new Error('This tool is not available for the selected file yet.');
}

// ---------------------------------------------------------------------------
// Install helpers
// ---------------------------------------------------------------------------

function wingetArgsFor(tool) {
  const id = WINGET_IDS[tool];
  if (!id) return null;
  return ['install', '--id', id, '-e', '--accept-source-agreements', '--accept-package-agreements', '--silent'];
}

module.exports = {
  getToolStatus,
  refreshTools,
  TOOL_LABELS,
  WINGET_IDS,
  wingetArgsFor,
  probe,
  convert,
  runTool,
  runProcess,
  uniquePath,
  uniqueFolder,
  identify
};
