// "I just wanted Snake" — a meme about AI agents building games and apps.
//
// The joke, in one picture: a human types one prompt, "MAKE ME A GAME", and
// the agent over-delivers absurdly — 17 files, 2,285 lines, 7 missions, car
// stealing, police, a wanted system — and the human only ever wanted Snake.
// The bottom panel shows the punchline visually: what was asked for (a tiny
// snake) against what arrived (a whole open-world city with a wanted level).
// It is the true story of our own GTA 6 bounty entry, which really did grow
// from one prompt into 2,285 lines and 7 missions.
//
// The program draws the meme pixel by pixel into a 1024x1024 RGB
// framebuffer — chat header, message bubbles, and the two-panel footer —
// encodes it as a PNG with the standard library only, and writes it to
// $MAKEFUN_OUTPUT_DIR/entry.png (default /output). No network, no bundled
// image file, no randomness: the same code always produces the same bytes.
// After writing, the output is read back, compared byte for byte with what
// was encoded, and checked against the competition caps (at most 1 MiB, at
// most 1024x1024); any mismatch fails loudly instead of silently leaving
// a broken entry behind.
//
// The 5x7 pixel font and the PNG encoder are reused from our own
// news-image-20261123 entry; the meme, its layout and every drawing in it
// are new for this bounty.
//
// Node 22, standard library only. Run it with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

const W = 1024;
const H = 1024;
const MAX_BYTES = 1024 * 1024;
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

type RGB = [number, number, number];
const CHAT_BG: RGB = [238, 238, 236];
const NAVY: RGB = [18, 24, 38];
const WHITE: RGB = [255, 255, 255];
const INK: RGB = [18, 18, 20];
const BLUE: RGB = [0, 132, 255];
const BUBBLE_BORDER: RGB = [208, 208, 205];
const GREEN: RGB = [34, 180, 90];
const SNAKE_GREEN: RGB = [46, 160, 67];
const RED: RGB = [220, 40, 40];
const GOLD: RGB = [250, 200, 40];
const CITY: RGB = [30, 32, 40];
const ROAD: RGB = [62, 64, 74];
const BUILDING_A: RGB = [150, 152, 158];
const BUILDING_B: RGB = [118, 120, 128];
const GREY: RGB = [110, 110, 108];

// 5x7 pixel font, one row per string, '#' is ink, '.' is clear.
const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#..##', '#.#.#', '##..#', '#...#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '...#.', '..#..', '..#..', '..#..'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '.##..', '.#...'],
  "'": ['..#..', '..#..', '..#..', '.....', '.....', '.....', '.....'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
};

// --- framebuffer helpers -------------------------------------------------

function makeCanvas(): Buffer {
  return Buffer.alloc(W * H * 3);
}

function put(fb: Buffer, x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  fb[i] = c[0];
  fb[i + 1] = c[1];
  fb[i + 2] = c[2];
}

function fill(fb: Buffer, x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      fb[i] = c[0];
      fb[i + 1] = c[1];
      fb[i + 2] = c[2];
    }
  }
}

function disc(fb: Buffer, cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) put(fb, x, y, c);
    }
  }
}

// Rounded rectangle: fill, cut the four corners back to the background,
// then paint a disc of the fill colour into each corner.
function roundRect(fb: Buffer, x: number, y: number, w: number, h: number, r: number, c: RGB, bg: RGB): void {
  fill(fb, x, y, w, h, c);
  fill(fb, x, y, r, r, bg);
  fill(fb, x + w - r, y, r, r, bg);
  fill(fb, x, y + h - r, r, r, bg);
  fill(fb, x + w - r, y + h - r, r, r, bg);
  disc(fb, x + r, y + r, r, c);
  disc(fb, x + w - r - 1, y + r, r, c);
  disc(fb, x + r, y + h - r - 1, r, c);
  disc(fb, x + w - r - 1, y + h - r - 1, r, c);
}

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(fb: Buffer, s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s) {
    const g = GLYPHS[ch] || GLYPHS['?'];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '#') {
          fill(fb, cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawCentred(fb: Buffer, s: string, y: number, scale: number, c: RGB): void {
  drawText(fb, s, Math.floor((W - textWidth(s, scale)) / 2), y, scale, c);
}

// A five-point star, drawn from a 7x7 pixel pattern, scaled up.
const STAR: string[] = [
  '...#...',
  '...#...',
  '#######',
  '.#####.',
  '..###..',
  '.#...#.',
  '#.....#',
];

function drawStar(fb: Buffer, x: number, y: number, scale: number, c: RGB): void {
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 7; col++) {
      if (STAR[r][col] === '#') {
        fill(fb, x + col * scale, y + r * scale, scale, scale, c);
      }
    }
  }
}

// --- PNG encoding (zlib + CRC32, standard library only) -------------------

const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table.push(c >>> 0);
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePng(fb: Buffer): Buffer {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    fb.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- the meme ---------------------------------------------------------------

function bubble(fb: Buffer, text: string, x: number, y: number, scale: number, c: RGB, tc: RGB, border: RGB | null): void {
  const w = textWidth(text, scale) + 48;
  const h = 7 * scale + 32;
  if (border) {
    roundRect(fb, x - 2, y - 2, w + 4, h + 4, 16, border, CHAT_BG);
  }
  roundRect(fb, x, y, w, h, 14, c, CHAT_BG);
  drawText(fb, text, x + 24, y + 16, scale, tc);
}

function drawHeader(fb: Buffer): void {
  fill(fb, 0, 0, W, 84, NAVY);
  // Robot avatar: steel circle, antenna, two eyes, a small smile.
  disc(fb, 58, 42, 26, [120, 128, 140]);
  fill(fb, 56, 10, 4, 8, [120, 128, 140]);
  disc(fb, 58, 9, 4, GOLD);
  disc(fb, 49, 38, 5, WHITE);
  disc(fb, 67, 38, 5, WHITE);
  disc(fb, 49, 38, 2, INK);
  disc(fb, 67, 38, 2, INK);
  fill(fb, 50, 52, 16, 3, WHITE);
  drawText(fb, 'MY AI AGENT', 100, 20, 4, WHITE);
  disc(fb, 108, 62, 5, GREEN);
  drawText(fb, 'ONLINE', 122, 54, 2, GREEN);
}

function drawChat(fb: Buffer): void {
  // The human, on the right in blue.
  bubble(fb, 'MAKE ME A GAME', 588, 108, 4, BLUE, WHITE, null);
  // The agent, on the left in white, over-delivering with every message.
  bubble(fb, 'DONE.', 32, 192, 4, WHITE, INK, BUBBLE_BORDER);
  bubble(fb, '17 FILES. 2,285 LINES.', 32, 272, 4, WHITE, INK, BUBBLE_BORDER);
  bubble(fb, '7 MISSIONS. CAR STEALING. POLICE.', 32, 352, 4, WHITE, INK, BUBBLE_BORDER);
  bubble(fb, 'I EVEN ADDED A WANTED SYSTEM.', 32, 432, 4, WHITE, INK, BUBBLE_BORDER);
  // The human, defeated.
  bubble(fb, 'I JUST WANTED SNAKE', 492, 512, 4, BLUE, WHITE, null);
}

function drawSnake(fb: Buffer, x0: number, y0: number): void {
  // A tiny snake: a wavy line of green blocks, chasing a red apple.
  const s = 26;
  const cells: [number, number][] = [
    [0, 2], [1, 2], [2, 2], [2, 1], [3, 1], [4, 1], [4, 0], [5, 0],
  ];
  for (const [cx, cy] of cells) {
    fill(fb, x0 + cx * s, y0 + cy * s, s - 3, s - 3, SNAKE_GREEN);
  }
  // The head, with one eye, facing the apple.
  fill(fb, x0 + 6 * s, y0 + 0 * s, s - 3, s - 3, SNAKE_GREEN);
  disc(fb, x0 + 6 * s + 18, y0 + 8, 3, WHITE);
  disc(fb, x0 + 6 * s + 18, y0 + 8, 1, INK);
  // The apple.
  fill(fb, x0 + 8 * s, y0 + 0 * s, s - 3, s - 3, RED);
  fill(fb, x0 + 8 * s + 10, y0 - 8, 4, 8, SNAKE_GREEN);
}

function drawCity(fb: Buffer, x0: number, y0: number, w: number, h: number): void {
  // A top-down open-world city: dark ground, roads, building blocks,
  // and one red car mid-heist on the main road.
  fill(fb, x0, y0, w, h, CITY);
  // Roads: two horizontal, two vertical.
  fill(fb, x0, y0 + 84, w, 34, ROAD);
  fill(fb, x0, y0 + 190, w, 34, ROAD);
  fill(fb, x0 + 110, y0, 34, h, ROAD);
  fill(fb, x0 + 268, y0, 34, h, ROAD);
  // Buildings between the roads.
  fill(fb, x0 + 16, y0 + 14, 78, 56, BUILDING_A);
  fill(fb, x0 + 160, y0 + 14, 92, 56, BUILDING_B);
  fill(fb, x0 + 318, y0 + 14, 78, 56, BUILDING_A);
  fill(fb, x0 + 16, y0 + 132, 78, 44, BUILDING_B);
  fill(fb, x0 + 160, y0 + 132, 92, 44, BUILDING_A);
  fill(fb, x0 + 318, y0 + 132, 78, 44, BUILDING_B);
  fill(fb, x0 + 16, y0 + 238, 78, 44, BUILDING_A);
  fill(fb, x0 + 160, y0 + 238, 92, 44, BUILDING_B);
  fill(fb, x0 + 318, y0 + 238, 78, 44, BUILDING_A);
  // Road markings: dashes down the middle of each road.
  for (let x = x0 + 8; x < x0 + w - 20; x += 44) {
    fill(fb, x, y0 + 99, 24, 4, [200, 200, 190]);
    fill(fb, x, y0 + 205, 24, 4, [200, 200, 190]);
  }
  for (let y = y0 + 8; y < y0 + h - 20; y += 44) {
    fill(fb, x0 + 125, y, 4, 24, [200, 200, 190]);
    fill(fb, x0 + 283, y, 4, 24, [200, 200, 190]);
  }
  // The getaway car, red, on the main road with a white windshield.
  fill(fb, x0 + 176, y0 + 88, 56, 26, RED);
  fill(fb, x0 + 196, y0 + 92, 18, 18, WHITE);
}

function drawSnakeScreen(fb: Buffer, x0: number, y0: number, w: number, h: number): void {
  // The classic Snake game screen: a dark-bordered, pale-green board with
  // a faint dot grid, the snake chasing its apple. It fills the left half
  // the way the city fills the right, so the footer balances.
  fill(fb, x0, y0, w, h, CITY);
  fill(fb, x0 + 6, y0 + 6, w - 12, h - 12, [204, 222, 192]);
  for (let gy = y0 + 32; gy < y0 + h - 12; gy += 26) {
    for (let gx = x0 + 32; gx < x0 + w - 12; gx += 26) {
      fill(fb, gx, gy, 3, 3, [172, 192, 166]);
    }
  }
  drawSnake(fb, x0 + 44, y0 + 84);
}

function drawFooter(fb: Buffer): void {
  fill(fb, 32, 596, W - 64, 2, BUBBLE_BORDER);
  // Left: what was asked for. Right: what arrived. Labels centred in
  // their own halves, not on the whole canvas.
  drawText(fb, 'WHAT I ASKED FOR', 32 + Math.floor((464 - textWidth('WHAT I ASKED FOR', 2)) / 2), 616, 2, GREY);
  drawText(fb, 'WHAT I GOT', 528 + Math.floor((464 - textWidth('WHAT I GOT', 2)) / 2), 616, 2, GREY);
  // Five wanted stars over the city.
  for (let i = 0; i < 5; i++) {
    drawStar(fb, 620 + i * 56, 648, 4, GOLD);
  }
  drawSnakeScreen(fb, 96, 676, 304, 304);
  drawCity(fb, 560, 700, 400, 296);
}

function buildMeme(): Buffer {
  const fb = makeCanvas();
  fill(fb, 0, 0, W, H, CHAT_BG);
  drawHeader(fb);
  drawChat(fb);
  drawFooter(fb);
  return fb;
}

function main(): void {
  const png = encodePng(buildMeme());
  if (png.length > MAX_BYTES) {
    throw new Error(`entry.png is ${png.length} bytes, over the 1 MiB cap`);
  }
  // PNG header: width and height are big-endian uint32 at bytes 16 and 20.
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  if (w > 1024 || h > 1024) {
    throw new Error(`entry.png is ${w}x${h}, over the 1024x1024 cap`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const dest = join(OUT_DIR, 'entry.png');
  writeFileSync(dest, png);

  const written = readFileSync(dest);
  if (!written.equals(png)) throw new Error('output differs from the encoded image');
  if (statSync(dest).size !== png.length) throw new Error('output size mismatch');
}

main();
