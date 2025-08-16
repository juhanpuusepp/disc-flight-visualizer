<script lang="ts">
  import { onMount } from 'svelte';
  import type { Trajectory } from '../lib/types';

  export let points: Trajectory = [];
  export let paddingPct = 0.08; // fraction of height for padding
  export let upIsPositiveY = true; // positive Y goes up on screen

  // measure container
  let container: HTMLDivElement;
  let vw = 1, vh = 1;

  // derived draw data
  let viewBox = `0 0 ${vw} ${vh}`;
  let d = '';
  let hasPath = false;
  let startX = 0, startY = 0, endX = 0, endY = 0;

  // scale overlay data (right side)
  let axisX = 0, axisTop = 0, axisBottom = 0, usableY = 0;
  let ticks: Array<{ y: number; label: string }> = [];
  let meters: Array<{ y: number; cls: 'minor' | 'micro' }> = [];
  let endLabel = '';

  const round = (n: number) => Math.round(n * 100) / 100;

  function updateSize() {
    if (!container) return;
    const r = container.getBoundingClientRect();
    vw = Math.max(1, Math.floor(r.width));
    vh = Math.max(1, Math.floor(r.height));
  }

  onMount(() => {
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  });

  $: {
    const EPS = 1e-6;
    viewBox = `0 0 ${vw} ${vh}`;
    hasPath = points.length > 1;

    const padPx = vh * paddingPct;
    const anchorX = vw / 2;
    const anchorY = vh - padPx;
    usableY = Math.max(EPS, anchorY - padPx);

    // right-side ruler geometry
    axisX = vw - 40;
    axisTop = padPx;
    axisBottom = anchorY;

    // meters every 10m
    ticks = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const y = anchorY - t * usableY;
      const label = `${Math.round(t * 100)}`;
      ticks.push({ y, label });
    }

    meters = [];
for (let i = 0; i <= 100; i++) {
  if (i % 10 === 0) continue;               // skip 0,10,20,... (majors already drawn)
  const t = i / 100;
  const y = anchorY - t * usableY;
  const cls = i % 5 === 0 ? 'minor' : 'micro';  // 5-step gets a longer notch
  meters.push({ y, cls });
}

    if (hasPath) {
      // SCALE: 1 world Y unit = full usable vertical pixels (bottom pad → top pad)
      const scale = usableY;

      // anchor bottom-center in world coords
      const s = points[0];
      const toScreen = (px: number, py: number) => {
        const dx = (px - s.x) * scale;
        const dy = (py - s.y) * scale;
        const x = anchorX + dx;
        const y = upIsPositiveY ? anchorY - dy : anchorY + dy;
        return [x, y] as const;
      };

      // build path
      const [x0, y0] = toScreen(points[0].x, points[0].y);
      let path = `M ${round(x0)} ${round(y0)}`;
      for (let i = 1; i < points.length; i++) {
        const [xi, yi] = toScreen(points[i].x, points[i].y);
        path += ` L ${round(xi)} ${round(yi)}`;
      }
      d = path;

      // markers
      [startX, startY] = [x0, y0];
      const last = points[points.length - 1];
      [endX, endY] = toScreen(last.x, last.y);

      // current length label on the ruler (percent of usable height)
      const frac = Math.max(0, Math.min(1, (anchorY - endY) / usableY));
      endLabel = `${Math.round(frac * 100)}%`;
    } else {
      d = '';
      startX = startY = endX = endY = 0;
      endLabel = '';
    }
  }
</script>

<style>
  .wrap { width: 100%; height: 100%; min-height: 280px; }
  svg  { width: 100%; height: 100%; display: block; background: var(--bg, transparent); }

  .path  { fill: none; stroke: #ffffffb0; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
  .start { fill: #2e8b57; }
  .end   { fill: #ffffff00; }

  /* ruler */
  .axis { pointer-events: none; }
  .axis-line { stroke: #66666689; stroke-width: 1; }
  .tick-line { stroke: #66666689; stroke-width: 1; }
  .tick-line.current { stroke: #00000086; stroke-width: 2; }
  .tick-label { fill: #66666689; font: 12px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  .tick-label.current { fill: #00000086; font-weight: 600; }

  .meter-line { stroke: #ddd; stroke-width: 1; }
  .meter-line.minor { stroke: #66666689; }
  .meter-line.micro { stroke: #66666689; }


  .hint  { font: 14px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; fill: #888; }
</style>

<div class="wrap" bind:this={container}>
  <!-- 'none' removes internal letterboxing so we can fill height exactly -->
  <svg {viewBox} preserveAspectRatio="none" role="img" aria-label="Disc trajectory">
    {#if hasPath}
      <path class="path" d={d} />
      <circle class="start" cx={startX} cy={startY} r="4" />
      <circle class="end"   cx={endX}   cy={endY}   r="4" />

      <g class="axis">
        <line class="axis-line" x1={axisX} y1={axisBottom} x2={axisX} y2={axisTop} />

        <!-- ticks and meters -->
        {#each ticks as t}
          <line class="tick-line" x1={axisX - 8} y1={t.y} x2={axisX} y2={t.y} />
          <text class="tick-label" x={axisX - 10} y={t.y} dominant-baseline="middle" text-anchor="end">
            {t.label}
          </text>
        {/each}

        {#each meters as m}
          <line
            class="meter-line {m.cls}"
            x1={axisX - (m.cls === 'minor' ? 6 : 3)}
            y1={m.y}
            x2={axisX}
            y2={m.y}
          />
        {/each}

        <line class="tick-line current" x1={axisX - 15} y1={endY} x2={axisX + 7} y2={endY} />
        <text class="tick-label current" x={axisX + 35} y={endY} dominant-baseline="middle" text-anchor="end">
          {endLabel}
        </text>
      </g>
    {:else}
      <text class="hint" x={vw/2} y={vh/2} text-anchor="middle" dominant-baseline="middle">
        No points to draw
      </text>
    {/if}
  </svg>
</div>
