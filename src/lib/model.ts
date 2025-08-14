// src/lib/model.ts
// Vertical trajectory whose length depends ONLY on Speed.
// Speed 1 → 0.55 of drawable height; Speed 14 → 1.0 (top).

import type { FlightParams, Point, Trajectory } from './types';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function computeTrajectory(params: FlightParams): Trajectory {
  // Normalize speed 1..14 → 0..1
  const sN = clamp01((params.speed - 1) / 13);

  // Map speed to vertical fraction f (0.55..1.0)
  const f = 0.5 + 0.45 * sN;

  // Generate a straight vertical path from y=0 to y=f in "world units"
  const N = 200; // sample count (constant; smooth enough)
  const pts: Point[] = new Array(N);
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);        // 0..1 along the path
    const y = u * f;              // end at fraction f
    pts[i] = { x: 0, y };         // x fixed so endpoint is directly above start
  }
  return pts as Trajectory;
}

// Kept for potential handedness later
export function mirrorLateral(points: Trajectory): Trajectory {
  return points.map((p) => ({ x: p.x, y: -p.y })) as Trajectory;
}
