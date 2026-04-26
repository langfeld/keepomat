// Deterministische Fallback-Bilder für Lesezeichen ohne Screenshot/OG-Image
// Generiert SVG mit gedämpften Farben, großen Mustern und dem Anfangsbuchstaben des Titels

const PALETTES = [
  ["#7c9eb2", "#5b7c99"],
  ["#c49476", "#a8785c"],
  ["#7ea89d", "#5e8a7f"],
  ["#c49b8c", "#ab7d6e"],
  ["#7aa6b5", "#598596"],
  ["#b8a0c4", "#9b82a8"],
  ["#d4a1a3", "#bc8789"],
  ["#869aaf", "#6b7f94"],
  ["#a8b898", "#8c9e7c"],
  ["#c49e9e", "#ab8282"],
  ["#89a3a0", "#6f8986"],
  ["#b4a298", "#9a887e"],
  ["#9aacc2", "#7e91a8"],
  ["#c4b0cc", "#aa94b4"],
  ["#96b4a6", "#7c9a8c"],
  ["#c8baa4", "#b0a08a"],
  ["#94b0c0", "#7894a4"],
  ["#beafa0", "#a49486"],
  ["#9cb0ce", "#7e94b4"],
  ["#ccbaba", "#b4a0a0"],
];

function getInitial(title: string | undefined): string {
  if (!title?.trim()) return "";
  const first = title.trim()[0];
  const escaped = first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<text x="200" y="190" text-anchor="middle" font-family="system-ui, sans-serif" font-size="100" font-weight="700" fill="rgba(255,255,255,0.12)">${escaped}</text>`;
}

const PATTERNS = [
  (c1: string, c2: string, initial: string) =>
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>${initial}`,

  (c1: string, c2: string, initial: string) =>
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient><pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="8" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>${initial}`,

  (c1: string, c2: string, initial: string) =>
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="30" height="80" fill="rgba(255,255,255,0.06)"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>${initial}`,

  (c1: string, c2: string, initial: string) =>
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient><pattern id="p" width="120" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 Q30 5 60 20 T120 20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>${initial}`,

  (c1: string, c2: string, initial: string) =>
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient><pattern id="p" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="2"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>${initial}`,
];

export function getFallbackImage(id: number, title?: string): string {
  const paletteIndex = id % PALETTES.length;
  const patternIndex = Math.floor(id / PALETTES.length) % PATTERNS.length;
  const [c1, c2] = PALETTES[paletteIndex];
  const initial = getInitial(title);
  const patternSvg = PATTERNS[patternIndex](c1, c2, initial);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">${patternSvg}</svg>`;
  const base64 = typeof Buffer !== "undefined"
    ? Buffer.from(svg).toString("base64")
    : btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}
