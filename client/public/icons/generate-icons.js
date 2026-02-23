/**
 * Script to generate PWA icons from SVG
 * Run: node generate-icons.js
 *
 * Requires: sharp (npm install sharp --save-dev)
 * Or simply use an online tool to convert the SVG below to PNG at each size.
 *
 * Base SVG icon: ../favicon.svg
 */

const sizes = [72, 96, 128, 144, 192, 512];

// If you have sharp installed:
// const sharp = require('sharp');
// const path = require('path');
//
// async function generate() {
//   for (const size of sizes) {
//     await sharp(path.join(__dirname, '../favicon.svg'))
//       .resize(size, size)
//       .png()
//       .toFile(path.join(__dirname, `icon-${size}x${size}.png`));
//
//     // Maskable version (with padding)
//     if (size >= 192) {
//       const padding = Math.round(size * 0.1);
//       await sharp(path.join(__dirname, '../favicon.svg'))
//         .resize(size - padding * 2, size - padding * 2)
//         .extend({ top: padding, bottom: padding, left: padding, right: padding, background: '#1a56db' })
//         .png()
//         .toFile(path.join(__dirname, `icon-${size}x${size}-maskable.png`));
//     }
//   }
//   console.log('Icons generated!');
// }
// generate();

console.log('To generate PWA icons, install sharp and uncomment the code above.');
console.log('Alternatively, use https://realfavicongenerator.net/ with the SVG favicon.');
console.log('Required sizes:', sizes.join(', '));
