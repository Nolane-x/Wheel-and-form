'use strict';

const { PDFDocument, degrees } = require('pdf-lib');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

async function pageCount(input) {
  const bytes = await fsp.readFile(input);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

async function split(input, outDir, baseName) {
  const bytes = await fsp.readFile(input);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = doc.getPageCount();
  if (!total) throw new Error('This PDF has no pages.');
  await fsp.mkdir(outDir, { recursive: true });
  const outputs = [];
  for (let i = 0; i < total; i++) {
    const next = await PDFDocument.create();
    const [page] = await next.copyPages(doc, [i]);
    next.addPage(page);
    const out = path.join(outDir, `${baseName} ${i + 1}.pdf`);
    await fsp.writeFile(out, await next.save());
    outputs.push(out);
  }
  return outputs;
}

async function merge(inputs, output) {
  const merged = await PDFDocument.create();
  for (const input of inputs) {
    const bytes = await fsp.readFile(input);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  await fsp.writeFile(output, await merged.save());
  return output;
}

async function organize(input, output, action) {
  const bytes = await fsp.readFile(input);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  if (action === 'reverse') {
    const reordered = await PDFDocument.create();
    const copies = await reordered.copyPages(doc, doc.getPageIndices().slice().reverse());
    copies.forEach((p) => reordered.addPage(p));
    await fsp.writeFile(output, await reordered.save());
    return output;
  }
  const angle = action === 'rotate180' ? 180 : 90;
  for (const page of pages) {
    page.setRotation(degrees(page.getRotation().angle + angle));
  }
  await fsp.writeFile(output, await doc.save());
  return output;
}

async function create(images, output) {
  const doc = await PDFDocument.create();
  if (!images.length) throw new Error('Add at least one image.');
  for (const file of images) {
    const ext = path.extname(file).toLowerCase();
    const bytes = await fsp.readFile(file);
    let image;
    if (ext === '.png') image = await doc.embedPng(bytes);
    else image = await doc.embedJpg(bytes);
    const max = 1600;
    const scale = Math.min(1, max / Math.max(image.width, image.height));
    const w = Math.max(1, image.width * scale);
    const h = Math.max(1, image.height * scale);
    const page = doc.addPage([w, h]);
    page.drawImage(image, { x: 0, y: 0, width: w, height: h });
  }
  await fsp.writeFile(output, await doc.save());
  return output;
}

module.exports = { pageCount, split, merge, organize, create };
