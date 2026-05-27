import fs from 'fs';
import path from 'path';

const DUMP_FILE = path.join('.', 'dump.json'); 
const OUTPUT_FILE = path.join('.', 'decrypted.json');
const KNOWN_PREFIXES = ['faisal:', 'monjur:'];

function xorBlock(buf8, key8) {
  const out = Buffer.alloc(buf8.length);
  for (let i = 0; i < buf8.length; i++) out[i] = buf8[i] ^ key8[i % key8.length];
  return out;
}

function buildKeyFromCandidateBlock(candidateEncBlock, prefix) {
  const key = Buffer.alloc(8);
  key[0] = candidateEncBlock[0] ^ 0;
  for (let i = 0; i < 7; i++) key[i + 1] = candidateEncBlock[i + 1] ^ prefix.charCodeAt(i);
  return key;
}

function tryReconstruct(encBlocksBufs, key) {
  const n = encBlocksBufs.length;
  const plainBlocks = encBlocksBufs.map(b => xorBlock(b, key));
  const sorted = new Array(n);
  const seen = new Array(n).fill(false);

  for (let i = 0; i < n; i++) {
    const block = plainBlocks[i];
    const idx = block[0];
    if (!Number.isInteger(idx) || idx < 0 || idx >= n) return null;
    if (seen[idx]) return null;
    seen[idx] = true;
    sorted[idx] = block.slice(1);
  }
  if (seen.some(x => !x)) return null;

  const msgBuf = Buffer.concat(sorted);
  return msgBuf.toString('utf8').replace(/\n+$/, '');
}

function decryptMessageBlockArray(base64Blocks) {
  const encBlocksBufs = base64Blocks.map(b64 => Buffer.from(b64, 'base64'));

  for (let candidateIdx = 0; candidateIdx < encBlocksBufs.length; candidateIdx++) {
    const candidateEncBlock = encBlocksBufs[candidateIdx];

    for (const prefix of KNOWN_PREFIXES) {
      const key = buildKeyFromCandidateBlock(candidateEncBlock, prefix);
      const text = tryReconstruct(encBlocksBufs, key);
      if (!text) continue;
      if (text.startsWith(prefix)) {
        const splitIdx = text.indexOf(':');
        const sender = splitIdx !== -1 ? text.slice(0, splitIdx) : 'unknown';
        const content = splitIdx !== -1 ? text.slice(splitIdx + 1) : text;
        return { sender, content };
      }
    }
  }

  return { sender: 'unknown', content: '[Failed to decrypt]' };
}
function main() {
  if (!fs.existsSync(DUMP_FILE)) {
    console.error('dump.json not found');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DUMP_FILE, 'utf8'));
  const out = raw.map(base64Blocks => decryptMessageBlockArray(base64Blocks));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log('Decrypted messages saved to', OUTPUT_FILE);
}

main();
