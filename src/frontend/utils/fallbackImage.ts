// Deterministische Fallback-Bilder für Lesezeichen ohne Screenshot/OG-Image
// Generiert SVG-Gradienten basierend auf einer numerischen ID

const PALETTES = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#30cfd0", "#330867"],
  ["#a8edea", "#fed6e3"],
  ["#ff9a9e", "#fecfef"],
  ["#ffecd2", "#fcb69f"],
  ["#a18cd1", "#fbc2eb"],
  ["#fad0c4", "#ffd1ff"],
  ["#84fab0", "#8fd3f4"],
  ["#e0c3fc", "#8ec5fc"],
  ["#fccb90", "#d57eeb"],
  ["#e0c3fc", "#8ec5fc"],
  ["#f6d365", "#fda085"],
  ["#5ee7df", "#b490ca"],
  ["#d299c2", "#fef9d7"],
  ["#89f7fe", "#66a6ff"],
  ["#fddb92", "#d1fdff"],
];

const PATTERNS = [
  // Diagonal stripes
  (c1: string, c2: string) =>
    `<defs><pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="20" fill="${c1}"/></defs><rect width="100%" height="100%" fill="${c2}"/><rect width="100%" height="100%" fill="url(#p)"/>`,
  // Dots
  (c1: string, c2: string) =>
    `<defs><pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3" fill="${c1}"/></defs><rect width="100%" height="100%" fill="${c2}"/><rect width="100%" height="100%" fill="url(#p)"/>`,
  // Grid
  (c1: string, c2: string) =>
    `<defs><pattern id="p" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="${c1}" stroke-width="1.5"/></defs><rect width="100%" height="100%" fill="${c2}"/><rect width="100%" height="100%" fill="url(#p)"/>`,
  // Circles
  (c1: string, c2: string) =>
    `<defs><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="12" fill="none" stroke="${c1}" stroke-width="1.5"/></defs><rect width="100%" height="100%" fill="${c2}"/><rect width="100%" height="100%" fill="url(#p)"/>`,
  // Gradient (no pattern)
  (c1: string, c2: string) =>
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></defs><rect width="100%" height="100%" fill="url(#g)"/>`,
  // Radial circles
  (c1: string, c2: string) =>
    `<defs><pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="6" fill="${c1}" opacity="0.35"/></defs><rect width="100%" height="100%" fill="${c2}"/><rect width="100%" height="100%" fill="url(#p)"/>`,
  // Zigzag
  (c1: string, c2: string) =>
    `<defs><pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 L10 0 L20 10 L10 20 Z" fill="${c1}" opacity="0.25"/></defs><rect width="100%" height="100%" fill="${c2}"/><rect width="100%" height="100%" fill="url(#p)"/>`,
  // Waves
  (c1: string, c2: string) =>
    `<defs><pattern id="p" width="40" height="10" patternUnits="userSpaceOnUse"><path d="M0 5 Q10 0 20 5 T40 5" fill="none" stroke="${c1}" stroke-width="1.5"/></defs><rect width="100%" height="100%" fill="${c2}"/><rect width="100%" height="100%" fill="url(#p)"/>`,
];

export function getFallbackImage(id: number): string {
  const paletteIndex = id % PALETTES.length;
  const patternIndex = Math.floor(id / PALETTES.length) % PATTERNS.length;
  const [c1, c2] = PALETTES[paletteIndex];
  const patternSvg = PATTERNS[patternIndex](c1, c2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">${patternSvg}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
