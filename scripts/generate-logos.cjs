const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// 1. Square Logo SVG (Exact match for 小管家logo_白底(螢幕清晰用).png)
const squareLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <!-- Figure Body Gradient: Vibrant Cyan-Blue to Rich Royal Blue -->
    <linearGradient id="bodyGrad" x1="85%" y1="15%" x2="25%" y2="85%">
      <stop offset="0%" stop-color="#00A2EA" />
      <stop offset="45%" stop-color="#007FD9" />
      <stop offset="100%" stop-color="#005BAC" />
    </linearGradient>

    <!-- Head Gradient: Bright Cyan-Blue to Deep Sky Blue -->
    <linearGradient id="headGrad" x1="25%" y1="10%" x2="75%" y2="90%">
      <stop offset="0%" stop-color="#1EAEF1" />
      <stop offset="50%" stop-color="#0095E5" />
      <stop offset="100%" stop-color="#006BB8" />
    </linearGradient>

    <!-- Star Gradient: Luminous Gold to Warm Amber Orange -->
    <linearGradient id="starGrad" x1="30%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="#FFE144" />
      <stop offset="45%" stop-color="#FBA419" />
      <stop offset="100%" stop-color="#EB6100" />
    </linearGradient>

    <!-- Warm Star Glow/Shadow -->
    <filter id="starGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#F59E0B" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Clean Pure White Background -->
  <rect width="1000" height="1000" fill="#FFFFFF" />

  <!-- ICON GROUP -->
  <g transform="translate(10, 5)">
    <!-- Head Circle -->
    <circle cx="468" cy="292" r="54" fill="url(#headGrad)" />

    <!-- Dynamic Figure (Arms & Sweeping Torso) -->
    <path
      d="M 318 362
         C 355 367, 405 372, 458 372
         C 512 372, 570 332, 626 270
         C 610 375, 560 480, 480 560
         C 435 605, 375 625, 318 606
         C 382 550, 422 480, 396 425
         C 383 398, 350 380, 318 362 Z"
      fill="url(#bodyGrad)"
    />

    <!-- Reaching 5-Pointed Star -->
    <g transform="translate(686, 192) rotate(14)" filter="url(#starGlow)">
      <polygon
        points="0,-72 21,-22 75,-22 33,12 49,64 0,33 -49,64 -33,12 -75,-22 -21,-22"
        fill="url(#starGrad)"
      />
    </g>
  </g>

  <!-- Chinese Brand Name -->
  <text
    x="500"
    y="758"
    text-anchor="middle"
    font-family="'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif"
    font-size="78"
    font-weight="900"
    fill="#005BAC"
    letter-spacing="5"
  >小管家兒童理財</text>

  <!-- English Subtitle -->
  <text
    x="500"
    y="845"
    text-anchor="middle"
    font-family="'Montserrat', 'Nunito', 'Segoe UI', Arial, sans-serif"
    font-size="38"
    font-weight="700"
    fill="#005BAC"
    letter-spacing="2.5"
  >Start Smart with Money</text>
</svg>`;

// 2. Icon-only SVG (Transparent background, scalable vector for navbar/footer)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="290 100 480 530" width="480" height="530" fill="none">
  <defs>
    <linearGradient id="bodyGradIcon" x1="85%" y1="15%" x2="25%" y2="85%">
      <stop offset="0%" stop-color="#00A2EA" />
      <stop offset="45%" stop-color="#007FD9" />
      <stop offset="100%" stop-color="#005BAC" />
    </linearGradient>
    <linearGradient id="headGradIcon" x1="25%" y1="10%" x2="75%" y2="90%">
      <stop offset="0%" stop-color="#1EAEF1" />
      <stop offset="50%" stop-color="#0095E5" />
      <stop offset="100%" stop-color="#006BB8" />
    </linearGradient>
    <linearGradient id="starGradIcon" x1="30%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="#FFE144" />
      <stop offset="45%" stop-color="#FBA419" />
      <stop offset="100%" stop-color="#EB6100" />
    </linearGradient>
    <filter id="starGlowIcon" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#F59E0B" flood-opacity="0.35" />
    </filter>
  </defs>

  <g transform="translate(10, 5)">
    <!-- Head Circle -->
    <circle cx="468" cy="292" r="54" fill="url(#headGradIcon)" />

    <!-- Dynamic Torso and Arms -->
    <path
      d="M 318 362
         C 355 367, 405 372, 458 372
         C 512 372, 570 332, 626 270
         C 610 375, 560 480, 480 560
         C 435 605, 375 625, 318 606
         C 382 550, 422 480, 396 425
         C 383 398, 350 380, 318 362 Z"
      fill="url(#bodyGradIcon)"
    />

    <!-- Star -->
    <g transform="translate(686, 192) rotate(14)" filter="url(#starGlowIcon)">
      <polygon
        points="0,-72 21,-22 75,-22 33,12 49,64 0,33 -49,64 -33,12 -75,-22 -21,-22"
        fill="url(#starGradIcon)"
      />
    </g>
  </g>
</svg>`;

// Write SVGs to public directory
const publicDir = path.join(process.cwd(), 'public');
fs.writeFileSync(path.join(publicDir, 'logo.svg'), squareLogoSvg);
fs.writeFileSync(path.join(publicDir, 'logo-icon.svg'), iconSvg);

// Render high-res PNGs
const resvgSquare = new Resvg(squareLogoSvg, { fitTo: { mode: 'width', value: 1024 } });
const squarePngBuffer = resvgSquare.render().asPng();

fs.writeFileSync(path.join(publicDir, 'logo.png'), squarePngBuffer);
fs.writeFileSync(path.join(publicDir, '小管家logo_白底(螢幕清晰用).png'), squarePngBuffer);

const resvgIcon = new Resvg(iconSvg, { fitTo: { mode: 'width', value: 512 } });
const iconPngBuffer = resvgIcon.render().asPng();
fs.writeFileSync(path.join(publicDir, 'logo-icon.png'), iconPngBuffer);

console.log('Generated successfully!');
