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
