// src/lib/types.ts

// Geometry
export type Point = Readonly<{ x: number; y: number }>;
export type Trajectory = ReadonlyArray<Point>;

// Inputs
export type FlightParams = Readonly<{
  speed: number; // 1..14
  glide: number; // 1..7
  turn: number;  // -5..+1
  fade: number;  // 0..5
}>;

// Viewport + ranges
export type Viewport = Readonly<{ width: number; height: number; paddingPct?: number }>;
export type IntRange = Readonly<{ min: number; max: number; step: number }>;

// Limits for inputs
export const FLIGHT_LIMITS = {
    speed: { min: 1,  max: 14, step: 1 },
    glide: { min: 1,  max: 7,  step: 1 },
    turn:  { min: -5, max: 1,  step: 1 },
    fade:  { min: 0,  max: 5,  step: 1 },
  } as const;
  
  export const DEFAULT_PARAMS = {
    speed: 1, glide: 1, turn: 0, fade: 0,
  } as const;
