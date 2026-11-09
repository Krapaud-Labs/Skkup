import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptDirectory, "..");
const servedIconDirectory = path.join(frontendDirectory, "assets/icons/ui");
const registryPath = path.join(frontendDirectory, "src/components/ui/SkkupIcon.tsx");
const [inputArgument, outputArgument] = process.argv.slice(2);

if (!inputArgument || !outputArgument) {
  throw new Error("Usage: node scripts/recolor-ui-icons-neutral.mjs <input-icon-directory> <output-directory>");
}

const inputDirectory = path.resolve(inputArgument);
const outputDirectory = path.resolve(outputArgument);
if (outputDirectory === servedIconDirectory || outputDirectory.startsWith(`${servedIconDirectory}${path.sep}`)) {
  throw new Error("Generate and validate replacements outside the served icon directory first.");
}

const registry = await readFile(registryPath, "utf8");
const filenames = [...new Set([...registry.matchAll(/:\s*"\/assets\/icons\/ui\/([^"#]+\.png)/g)].map((match) => match[1]))];
if (filenames.length !== 29) {
  throw new Error(`Expected 29 registered UI icons, found ${filenames.length}.`);
}

await mkdir(outputDirectory, { recursive: true });
for (const filename of filenames) {
  const inputPath = path.join(inputDirectory, filename);
  const outputPath = path.join(outputDirectory, filename);
  const image = sharp(inputPath, { failOn: "error" });
  const metadata = await image.metadata();
  if (metadata.width !== 1254 || metadata.height !== 1254 || metadata.channels !== 4 || !metadata.hasAlpha) {
    throw new Error(`${filename} must be 1254x1254 RGBA; received ${metadata.width}x${metadata.height}, ${metadata.channels} channels.`);
  }

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 1254 || info.height !== 1254 || info.channels !== 4) {
    throw new Error(`${filename} did not decode as 1254x1254 RGBA.`);
  }
  const recolored = Buffer.from(data);
  for (let pixel = 0; pixel < recolored.length; pixel += 4) {
    const luminance = Math.round((2126 * data[pixel] + 7152 * data[pixel + 1] + 722 * data[pixel + 2]) / 10000);
    const silver = 64 + Math.round((191 * luminance) / 255);
    recolored[pixel] = silver;
    recolored[pixel + 1] = silver;
    recolored[pixel + 2] = silver;
    // The alpha byte is copied unchanged from the source buffer.
  }

  await sharp(recolored, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(outputPath);

  const output = await sharp(outputPath, { failOn: "error" }).raw().toBuffer({ resolveWithObject: true });
  if (output.info.width !== info.width || output.info.height !== info.height || output.info.channels !== info.channels) {
    throw new Error(`${filename} output dimensions or channel count changed.`);
  }
  for (let pixel = 0; pixel < data.length; pixel += 4) {
    if (output.data[pixel] !== output.data[pixel + 1] || output.data[pixel] !== output.data[pixel + 2]) {
      throw new Error(`${filename} output contains a non-neutral pixel at byte ${pixel}.`);
    }
    if (output.data[pixel + 3] !== data[pixel + 3]) {
      throw new Error(`${filename} alpha changed at pixel ${pixel / 4}.`);
    }
  }
  const digest = createHash("sha256").update(await readFile(outputPath)).digest("hex");
  process.stdout.write(`${filename}\tsha256=${digest}\talpha=identical\trgba=1254x1254\n`);
}

process.stdout.write(`Validated ${filenames.length} neutral grayscale UI icons in ${outputDirectory}\n`);
