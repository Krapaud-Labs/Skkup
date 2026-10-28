import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { dispositionIllustrationCarteParPalier } from "@/lib/scratch-card-reward";

const tiers = ["03", "07", "14", "platinum", "emerald"] as const;

async function sourceFoilComponent(tier: string) {
  const sourcePath = resolve(process.cwd(), `../asset/dashboard/rewards/scratch-tier-${tier}.png`);
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const x0 = Math.floor(width * 0.11);
  const x1 = Math.ceil(width * 0.97);
  const y0 = Math.floor(height * 0.32);
  const y1 = Math.ceil(height * 0.88);
  const neutralSilver = new Uint8Array(width * height);

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const offset = (y * width + x) * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const alpha = data[offset + 3];
      neutralSilver[y * width + x] = alpha > 200 && Math.min(red, green, blue) > 100 && Math.max(red, green, blue) - Math.min(red, green, blue) <= 32 ? 1 : 0;
    }
  }

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let largest = new Int32Array(0);
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const seed = y * width + x;
      if (!neutralSilver[seed] || visited[seed]) continue;
      let head = 0;
      let tail = 0;
      queue[tail++] = seed;
      visited[seed] = 1;
      while (head < tail) {
        const current = queue[head++];
        const currentX = current % width;
        const currentY = Math.floor(current / width);
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const nextX = currentX + dx;
            const nextY = currentY + dy;
            const next = nextY * width + nextX;
            if (nextX >= x0 && nextX < x1 && nextY >= y0 && nextY < y1 && neutralSilver[next] && !visited[next]) {
              visited[next] = 1;
              queue[tail++] = next;
            }
          }
        }
      }
      if (tail > largest.length) largest = queue.slice(0, tail);
    }
  }

  const component = new Uint8Array(width * height);
  const rows = new Map<number, { left: number; right: number }>();
  for (const pixel of largest) {
    component[pixel] = 1;
    const y = Math.floor(pixel / width);
    const x = pixel % width;
    const row = rows.get(y);
    rows.set(y, row ? { left: Math.min(row.left, x), right: Math.max(row.right, x) } : { left: x, right: x });
  }
  return { width, height, component, rows, referencePixels: largest.length };
}

describe("masques alpha des cartes à gratter", () => {
  test.each(tiers)("le masque %s suit la surface argentée du PNG source", async (tier) => {
    const source = await sourceFoilComponent(tier);
    const maskPath = resolve(process.cwd(), `../asset/dashboard/rewards/scratch-tier-${tier}-foil-mask.png`);
    const { data: mask, info } = await sharp(maskPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(info.width).toBe(source.width);
    expect(info.height).toBe(source.height);

    let maskPixels = 0;
    let intersection = 0;
    let sumX = 0;
    let sumY = 0;
    const maskBounds = { left: source.width, top: source.height, right: -1, bottom: -1 };
    for (let y = 0; y < source.height; y += 1) {
      let rowLeft = source.width;
      let rowRight = -1;
      for (let x = 0; x < source.width; x += 1) {
        const isMasked = mask[(y * source.width + x) * 4 + 3] > 0;
        if (!isMasked) continue;
        maskPixels += 1;
        sumX += x;
        sumY += y;
        maskBounds.left = Math.min(maskBounds.left, x);
        maskBounds.right = Math.max(maskBounds.right, x);
        maskBounds.top = Math.min(maskBounds.top, y);
        maskBounds.bottom = Math.max(maskBounds.bottom, y);
        rowLeft = Math.min(rowLeft, x);
        rowRight = Math.max(rowRight, x);
        if (source.component[y * source.width + x]) intersection += 1;
      }
      const sourceRow = source.rows.get(y);
      if (sourceRow) {
        expect(rowLeft).toBe(sourceRow.left);
        expect(rowRight).toBe(sourceRow.right);
      } else {
        expect(rowRight).toBe(-1);
      }
    }

    expect(maskBounds).toEqual({
      left: Math.min(...[...source.rows.values()].map((row) => row.left)),
      top: Math.min(...source.rows.keys()),
      right: Math.max(...[...source.rows.values()].map((row) => row.right)),
      bottom: Math.max(...source.rows.keys()),
    });
    expect(intersection / maskPixels).toBeGreaterThanOrEqual(0.97);
    expect(intersection / source.referencePixels).toBe(1);

    const palier = tier === "emerald" ? 51 : tier === "platinum" ? 30 : Number(tier);
    const reveal = dispositionIllustrationCarteParPalier(palier).reveal;
    expect(Math.abs((sumX / maskPixels / source.width) * 100 - reveal.left)).toBeLessThan(0.001);
    expect(Math.abs((sumY / maskPixels / source.height) * 100 - reveal.top)).toBeLessThan(0.001);
  });
});
