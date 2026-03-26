/**
 * Converts icons/icon.svg → icons/icon{16,32,48,128}.png
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install sharp (listed as devDependency)
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const svgBuf = readFileSync(resolve(root, "icons/icon.svg"));

for (const size of [16, 32, 48, 128]) {
  await sharp(svgBuf)
    .resize(size, size)
    .png()
    .toFile(resolve(root, `icons/icon${size}.png`));
  console.log(`icons/icon${size}.png`);
}
