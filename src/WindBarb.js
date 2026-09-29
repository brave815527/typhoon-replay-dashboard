import L from 'leaflet';

// Converts wind speed in m/s into wind barb SVG
// Standard: tail points INTO the wind origin
// 1 pennant = 50 knots (25 m/s)
// 1 long barb = 10 knots (5 m/s)
// 1 short barb = 5 knots (2.5 m/s)
export function createWindBarbIcon(speed, dir, baseColor="#dae2fd", opacity=1) {
  if (speed <= 0.3 || isNaN(dir) || dir === -999) {
    // Calm wind (2 knots or less) = faint gray circle
    const color = (speed <= 0.3) ? "rgba(161, 161, 170, 0.4)" : baseColor;
    const svg = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="2" fill="${color}" opacity="${opacity}" />
      </svg>`;
    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  // Convert m/s to knots
  const knots = speed * 1.94384;
  
  const pennants = Math.floor(knots / 50);
  let rem = knots % 50;
  const longBarbs = Math.floor(rem / 10);
  rem = rem % 10;
  const shortBarbs = Math.floor(rem / 5);

  const barbSpacing = 4;
  let currentY = 2; // start drawing feathers from top of shaft
  let svgPaths = '';

  // The shaft is vertical initially, pointing down. Center is at (10, 20).
  // Tail is at (10, 2). Head is at (10, 20).
  // When rotated by `dir`, if dir=360 (North), wind comes FROM North.
  // So shaft should point UP to North. Tail at top, head at center.
  // Wait, SVG default rotation rotates around center.
  // Center is (10, 20) in a 20x40 viewBox? Let's use 40x40 to be safe.
  // Shaft length = 24. Head at (20,20), Tail at (20, -4). 
  // Let's make shaft from (0,0) to (-length, 0) and translate.
  // Or just draw shaft from (20, 4) to (20, 20).
  const shaftTop = 2;
  const shaftBottom = 20;

  // Add Pennants
  for (let i = 0; i < pennants; i++) {
    // Triangle from shaft, to right, down to shaft
    svgPaths += `<path d="M 20 ${currentY} L 28 ${currentY + 2} L 20 ${currentY + 4} Z" fill="${baseColor}" stroke="${baseColor}" stroke-width="1.5" stroke-linejoin="round"/>`;
    currentY += 5;
  }

  // Add Long Barbs
  for (let i = 0; i < longBarbs; i++) {
    svgPaths += `<path d="M 20 ${currentY} L 28 ${currentY - 3}" fill="none" stroke="${baseColor}" stroke-width="1.5" stroke-linecap="round" />`;
    currentY += barbSpacing;
  }

  // Add Short Barbs
  for (let i = 0; i < shortBarbs; i++) {
    // short barb is drawn slightly down the shaft, not exactly at the tip if it's the only one 
    // but whatever, just draw it.
    svgPaths += `<path d="M 20 ${currentY} L 24 ${currentY - 1.5}" fill="none" stroke="${baseColor}" stroke-width="1.5" stroke-linecap="round" />`;
    currentY += barbSpacing;
  }

  // Shaft itself
  svgPaths += `<line x1="20" y1="${shaftTop}" x2="20" y2="${shaftBottom}" stroke="${baseColor}" stroke-width="1.5" stroke-linecap="round" />`;
  
  // Base circle at the station location
  svgPaths += `<circle cx="20" cy="${shaftBottom}" r="2" fill="none" stroke="${baseColor}" stroke-width="1.5"/>`;

  // Rotate entire group by direction. 
  // Wind dir 360 = North wind. Tail should point North. 
  // Above, tail is at Y=2, Head at Y=20. So tail is pointing UP (North) already.
  // Thus rotation amount is just `dir`.
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${dir}, 20, 20)" opacity="${opacity}">
        ${svgPaths}
      </g>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

export function getWindBarbColor(speed) {
  if (speed >= 51.0) return '#e11d48'; // 16~17級
  if (speed >= 32.7) return '#ef4444'; // 12~15級
  if (speed >= 24.5) return '#fb923c'; // 10~11級
  if (speed >= 13.9) return '#f59e0b'; // 7~9級
  if (speed >= 8.0) return '#06b6d4'; // 5~6級
  return '#94a3b8';
}

export function getScaleBadgeStyle(scale, speed, { type = 'scale' } = {}) {
  const isSpeed = type === 'speed';
  const label = isSpeed
    ? String(Math.round(speed || 0))
    : (speed >= 61.3 || scale >= 17 ? '17+' : String(scale));

  if (speed >= 61.3 || scale >= 17) {
    return {
      bg: 'linear-gradient(135deg, #a21caf, #e11d48)',
      border: '#f472b6',
      text: '#ffffff',
      glow: '0 0 12px rgba(244, 114, 182, 0.7)',
      label,
    };
  }
  if (scale >= 16) {
    return {
      bg: '#9333ea',
      border: '#c084fc',
      text: '#ffffff',
      glow: '0 0 10px rgba(192, 132, 252, 0.6)',
      label,
    };
  }
  if (scale >= 14) {
    return {
      bg: '#dc2626',
      border: '#f87171',
      text: '#ffffff',
      glow: '0 0 8px rgba(248, 113, 113, 0.6)',
      label,
    };
  }
  if (scale >= 12) {
    return {
      bg: '#ea580c',
      border: '#fb923c',
      text: '#ffffff',
      glow: '0 0 6px rgba(251, 146, 60, 0.5)',
      label,
    };
  }
  if (scale >= 10) {
    return {
      bg: '#d97706',
      border: '#fbbf24',
      text: '#ffffff',
      glow: '0 0 4px rgba(251, 191, 36, 0.4)',
      label,
    };
  }
  if (scale >= 7) {
    return {
      bg: '#0284c7',
      border: '#38bdf8',
      text: '#ffffff',
      glow: 'none',
      label,
    };
  }
  if (scale >= 5) {
    return {
      bg: '#0d9488',
      border: '#2dd4bf',
      text: '#ffffff',
      glow: 'none',
      label,
    };
  }
  return {
    bg: '#334155',
    border: '#64748b',
    text: '#cbd5e1',
    glow: 'none',
    label,
  };
}

export function createBeaufortBadgeIcon(scale, dir, speed, { displayType = 'scale', showArrow = false } = {}) {
  const style = getScaleBadgeStyle(scale, speed, { type: displayType });
  const hasDir = showArrow && dir !== null && dir !== undefined && !isNaN(dir) && dir >= 0;
  const arrowHtml = hasDir
    ? `<span style="display:inline-block; transform: rotate(${Number(dir) + 180}deg); font-size: 8px; margin-left: 1.5px; opacity: 0.9;">↓</span>`
    : '';

  const isWide = style.label.length >= 3;
  const width = isWide ? 26 : 22;
  const height = 22;

  const html = `
    <div style="
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: ${style.bg};
      color: ${style.text};
      border: 1.5px solid ${style.border};
      box-shadow: ${style.glow !== 'none' ? `${style.glow}, 0 2px 4px rgba(0,0,0,0.5)` : '0 2px 4px rgba(0,0,0,0.5)'};
      border-radius: 9999px;
      min-width: ${width}px;
      height: ${height}px;
      padding: 0 3px;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: -0.02em;
      line-height: 1;
      text-align: center;
      cursor: pointer;
      user-select: none;
      backdrop-filter: blur(4px);
    ">
      <span>${style.label}</span>${arrowHtml}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'beaufort-badge-container',
    iconSize: [width, height],
    iconAnchor: [Math.floor(width / 2), Math.floor(height / 2)],
  });
}

