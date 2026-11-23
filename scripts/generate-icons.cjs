const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createIconPng(width, height, isMaskable) {
  const bg = [0x0f, 0x0f, 0x14, 0xff];
  const accent = [0x6b, 0x8c, 0xff, 0xff];
  const accentDim = [0x3d, 0x50, 0xa0, 0xff];
  const textWhite = [0xf0, 0xf0, 0xf8, 0xff];

  const buffer = Buffer.alloc(height * (1 + width * 4));

  const safeMargin = isMaskable ? Math.round(width * 0.15) : 0;
  const innerW = width - safeMargin * 2;
  const innerH = height - safeMargin * 2;
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    buffer[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      let r = bg[0], g = bg[1], b = bg[2], a = bg[3];

      const bookHalfW = innerW * 0.35;
      const bookHalfH = innerH * 0.28;
      const leftPageX = cx - bookHalfW;
      const rightPageX = cx + bookHalfW;
      const pageTopY = cy - bookHalfH;
      const pageBottomY = cy + bookHalfH;

      const inBookArea = x >= leftPageX && x <= rightPageX && y >= pageTopY && y <= pageBottomY;

      if (inBookArea) {
        const distFromCenter = Math.abs(x - cx);
        if (distFromCenter < width * 0.02) {
          r = accentDim[0]; g = accentDim[1]; b = accentDim[2];
        } else {
          r = accent[0]; g = accent[1]; b = accent[2];

          const lineY = (y - pageTopY) % (innerH * 0.08);
          if (lineY > innerH * 0.03 && lineY < innerH * 0.05 && distFromCenter > innerW * 0.08) {
            r = textWhite[0]; g = textWhite[1]; b = textWhite[2];
          }
        }
      }

      buffer[pxOffset] = r;
      buffer[pxOffset + 1] = g;
      buffer[pxOffset + 2] = b;
      buffer[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(buffer);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createIconPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'icon-192-maskable.png'), createIconPng(192, 192, true));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createIconPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.png'), createIconPng(512, 512, true));
console.log('Ícones gerados com sucesso!');
