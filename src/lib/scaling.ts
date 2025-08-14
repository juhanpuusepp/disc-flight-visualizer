// src/lib/scaling.ts
// ... keep your existing imports and exports ...

import type { Point, Viewport } from './types';

export type FitOptions = Viewport & {
  /** If true, positive world Y goes up on screen; if false, positive world Y goes down. */
  upIsPositiveY?: boolean;
};

export type FitResult = {
  points: Point[];
  viewBox: string;
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  worldWidth: number;
  worldHeight: number;
};

const EPS = 1e-6;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Bounds helper (keep as you had it) */
export function getBounds(points: readonly Point[]) {
  if (!points.length) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  let minX = points[0].x, maxX = points[0].x;
  let minY = points[0].y, maxY = points[0].y;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

/**
 * NEW: Fit with the **start point fixed at bottom-center** of the viewport.
 * - Uniform scale chosen so the entire path fits within the viewport with padding.
 * - Start point maps to (width/2, height - paddingPx).
 */
export function fitStartBottomCenter(
  src: readonly Point[],
  opt: FitOptions = { width: 1000, height: 600, paddingPct: 0.08, upIsPositiveY: false }
): FitResult {
  const width = opt.width;
  const height = opt.height;
  const paddingPct = clamp01(opt.paddingPct ?? 0.08);
  const upIsPositiveY = opt.upIsPositiveY ?? false;

  const padPx = Math.max(0, Math.min(width, height) * paddingPct);

  const { minX, maxX, minY, maxY } = getBounds(src);
  const start = src[0] ?? { x: 0, y: 0 };

  // world spans relative to start
  const dxLeft  = Math.max(0, start.x - minX);
  const dxRight = Math.max(0, maxX - start.x);
  const dyDown  = Math.max(0, start.y - minY);
  const dyUp    = Math.max(0, maxY - start.y);

  // available pixels from the anchor (bottom-center) to each edge (minus padding)
  const anchorX = width / 2;
  const anchorY = height - padPx;

  const availLeftPx  = Math.max(EPS, anchorX - padPx);
  const availRightPx = Math.max(EPS, anchorX - padPx);
  const availUpPx    = Math.max(EPS, anchorY - padPx);
  const availDownPx  = Math.max(EPS, padPx);

  const ratio = (avail: number, span: number) => (span <= EPS ? Number.POSITIVE_INFINITY : avail / span);

  const scaleX = Math.min(ratio(availLeftPx, dxLeft), ratio(availRightPx, dxRight));
  const scaleY = Math.min(ratio(availUpPx, dyUp), ratio(availDownPx, dyDown));
  const scale = Math.max(0, Math.min(scaleX, scaleY, 1e6)); // cap for safety

  // Map points so start → (anchorX, anchorY).
  const mapped: Point[] = src.map((p) => {
    const dx = (p.x - start.x) * scale;
    const dy = (p.y - start.y) * scale;
    const x = anchorX + dx;
    // if upIsPositiveY=false, negative world Y goes **up** on screen (nice for “launch from bottom”)
    const y = upIsPositiveY ? anchorY - dy : anchorY + dy;
    return { x, y };
  });

  return {
    points: mapped,
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    scale,
    offsetX: 0,
    offsetY: 0,
    worldWidth: maxX - minX,
    worldHeight: maxY - minY,
  };
}

/** Keep your toSvgPath helper as-is */
export function toSvgPath(points: readonly Point[]): string {
  if (!points.length) return '';
  const [p0, ...rest] = points;
  let d = `M ${round(p0.x)} ${round(p0.y)}`;
  for (const p of rest) d += ` L ${round(p.x)} ${round(p.y)}`;
  return d;
}

const round = (n: number) => Math.round(n * 100) / 100;
