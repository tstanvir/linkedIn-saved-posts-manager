// Run with: node icons/generate-icons.js
// Generates PNG icons using canvas (requires node-canvas) or writes SVG placeholders.
// For production, replace the PNGs with proper artwork.

const fs = require("fs");
const path = require("path");

const sizes = [16, 32, 48, 128];

// Minimal SVG — LinkedIn-style blue square with "in"
function svg(size) {
  const r = Math.round(size * 0.15);
  const fs_ = Math.round(size * 0.45);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0A66C2"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial,sans-serif" font-weight="bold" font-size="${fs_}" fill="white">in</text>
</svg>`;
}

sizes.forEach((s) => {
  const out = path.join(__dirname, `icon${s}.svg`);
  fs.writeFileSync(out, svg(s), "utf8");
  console.log(`Written ${out}`);
});

console.log("SVG icons written. Convert to PNG with: npx sharp-cli or any SVG→PNG tool.");
