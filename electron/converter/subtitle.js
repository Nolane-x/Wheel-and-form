'use strict';

const fs = require('fs');

function convertText(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let prevBlank = false;
  for (const line of lines) {
    if (/^\d+$/.test(line.trim())) continue;
    if (/^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(line.trim())) continue;
    if (/^WEBVTT/.test(line.trim())) continue;
    if (/^NOTE/.test(line.trim())) continue;
    if (/^\s*$/.test(line)) {
      if (!prevBlank) out.push('');
      prevBlank = true;
      continue;
    }
    prevBlank = false;
    out.push(line);
  }
  return out.join('\n').trim() + '\n';
}

async function toTxt(input, output) {
  const text = await fs.promises.readFile(input, 'utf8');
  await fs.promises.writeFile(output, convertText(text), 'utf8');
  return output;
}

module.exports = { toTxt, convertText };

if (require.main === module) {
  const input = process.argv[2];
  const output = process.argv[3];
  if (input && output) {
    toTxt(input, output).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
}
