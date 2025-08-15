import type { FlightParams, Point, Trajectory } from './types';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// length scalers
const GLIDE_GAIN = 0.5;
const TURN_GAIN  = 0.08;

// turn shape
const PEAK_FRAC = 0.95;
const RETURN_FRAC = 0.95;
const RETURN_SOFTNESS = 2.2;

// fade shape
const FADE_LENGTH_FRAC = 0.4;
const FADE_BASE_CURVE = 3;
const FADE_PER_UNIT = 1.15;

export function computeTrajectory(params: FlightParams): Trajectory {
  const sN = clamp01((params.speed - 1) / 13);
  const gN = clamp01((params.glide - 1) / 6);

  const base = 0.5 + 0.45 * sN;
  const glideBoost = (1 - base) * (GLIDE_GAIN * gN);
  const f = Math.min(1, base + glideBoost);

  const forwardTurnFrac = Math.max(0, 1 - FADE_LENGTH_FRAC);
  const turnForwardTotal = f * forwardTurnFrac;

  const t = params.turn;
  const mag = clamp01(Math.abs(t) / 5);
  const dir = t < 0 ? +1 : t > 0 ? -1 : 0;

  const A = TURN_GAIN * mag * f;

  const N = 200;
  const pts: Point[] = new Array(N);

  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const y = u * turnForwardTotal;

    const peak = Math.max(0.05, Math.min(0.95, PEAK_FRAC));
    let profile: number;

    if (u <= peak) {
      const up = u / peak;
      profile = Math.pow(Math.sin(0.5 * Math.PI * up), 2);
    } else {
      let v = (u - peak) / (1 - peak);
      v = Math.pow(v, RETURN_SOFTNESS); // gentler start of the return
      profile = RETURN_FRAC + (1 - RETURN_FRAC) * Math.pow(Math.cos(0.5 * Math.PI * v), 2);
    }

    const x = A * dir * profile;
    pts[i] = { x, y };
  }

  const fadeForwardTotal = f - (pts[pts.length - 1].y); // ensures total ends at f exactly
  if (fadeForwardTotal > 0) {
    const fadeStart = pts[pts.length - 1];
    const fadePrev  = pts[pts.length - 2] ?? { x: fadeStart.x, y: fadeStart.y - 1e-6 };
    let heading = Math.atan2(fadeStart.y - fadePrev.y, fadeStart.x - fadePrev.x);

    const steps = Math.max(24, Math.round(160 * FADE_LENGTH_FRAC));
    const ds = fadeForwardTotal / steps;

    // always some fade, more with higher fade value
    const fadeStrength = FADE_BASE_CURVE + FADE_PER_UNIT * Math.max(0, params.fade);

    let px = fadeStart.x, py = fadeStart.y;

    for (let i = 1; i <= steps; i++) {
      // ramp so the join is as straight as possible
      const tRamp = i / steps;
      const ramp = 1 - Math.cos((Math.PI * 0.5) * tRamp);
      const k = fadeStrength * ramp;

      heading += k * ds;
      px += Math.cos(heading) * ds;
      py += Math.sin(heading) * ds;

      pts.push({ x: px, y: py });
    }
  }

  return pts as Trajectory;
}

// mirror RHBH throws for left handed people
export function mirrorLateral(points: Trajectory): Trajectory {
  return points.map((p) => ({ x: p.x, y: -p.y })) as Trajectory;
}
