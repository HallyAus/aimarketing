const sharp = require('sharp');

const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a56db"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
  <text x="512" y="580" font-family="Arial, Helvetica, sans-serif" font-size="480" font-weight="bold" fill="white" text-anchor="middle">AP</text>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile('apps/web/public/icon-1024.png')
  .then(() => console.log('Icon generated: apps/web/public/icon-1024.png'))
  .catch(err => console.error(err));
