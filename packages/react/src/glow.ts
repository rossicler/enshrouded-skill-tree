// The search highlight: a warm glow around a node, as three blurred rings
// (CSS box-shadows `0 0 16px 4px`, `0 0 40px 12px` and `0 0 72px 24px` around
// the node's circle). SVG has no box-shadow, and blur filters are slow to
// animate, so the rings are baked into one radial gradient per node size.

type Ring = { blur: number; spread: number; rgb: [number, number, number]; alpha: number };

// Top ring first, like CSS box-shadow lists.
const RINGS: Ring[] = [
  { blur: 16, spread: 4, rgb: [255, 170, 50], alpha: 0.6 },
  { blur: 40, spread: 12, rgb: [255, 120, 20], alpha: 0.35 },
  { blur: 72, spread: 24, rgb: [200, 80, 10], alpha: 0.15 },
];

// Past this distance from the node's edge the glow is invisible.
export const GLOW_REACH = 110;

// Complementary error function (Abramowitz and Stegun 7.1.26, error < 1.5e-7).
const erfc = (x: number): number => {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-z * z);
  return x >= 0 ? y : 2 - y;
};

export type GlowStop = { offset: number; color: string; opacity: number };

// Gradient stops for a node of radius `r`, over a circle of radius r + GLOW_REACH.
// Under the node it keeps the color at the node's edge, so the glow has no
// gap when its animation scales it up.
export const glowStops = (r: number, samples = 24): GlowStop[] => {
  const outer = r + GLOW_REACH;
  const stops: GlowStop[] = [];
  for (let i = 0; i <= samples; i++) {
    const d = r + (GLOW_REACH * i) / samples;
    // Paint the bottom ring first, then each ring over it.
    let alpha = 0;
    let rgb = [0, 0, 0];
    for (const ring of [...RINGS].reverse()) {
      const sigma = ring.blur / 2;
      const a = ring.alpha * 0.5 * erfc((d - (r + ring.spread)) / (sigma * Math.SQRT2));
      const out = a + alpha * (1 - a);
      if (out > 0) rgb = rgb.map((c, k) => (ring.rgb[k] * a + c * alpha * (1 - a)) / out);
      alpha = out;
    }
    const [red, green, blue] = rgb.map((c) => Math.round(c));
    stops.push({ offset: d / outer, color: `rgb(${red},${green},${blue})`, opacity: Number(alpha.toFixed(4)) });
  }
  return stops;
};
