<script lang="ts">
    import { onMount } from 'svelte';
    import type { Trajectory } from '../lib/types';
  
    export let points: Trajectory = [];
    export let paddingPct = 0.08;     // fraction of height for padding
    export let upIsPositiveY = true;  // positive Y goes up on screen
  
    // measure container
    let container: HTMLDivElement;
    let vw = 1, vh = 1;
  
    // derived draw data
    let viewBox = `0 0 ${vw} ${vh}`;
    let d = '';
    let hasPath = false;
    let startX = 0, startY = 0, endX = 0, endY = 0;
  
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
  
    // recompute mapping whenever size or points change
    $: {
      const EPS = 1e-6;
      viewBox = `0 0 ${vw} ${vh}`;
      hasPath = points.length > 1;
  
      if (hasPath) {
        // anchor bottom-center
        const padPx = vh * paddingPct;
        const anchorX = vw / 2;
        const anchorY = vh - padPx;
  
        // SCALE: 1 world Y unit = full usable vertical pixels (bottom pad → top pad)
        const usableY = Math.max(EPS, anchorY - padPx);
        const scale = usableY;
  
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
        [endX, endY] = toScreen(points.at(-1)!.x, points.at(-1)!.y);
      } else {
        d = '';
        startX = startY = endX = endY = 0;
      }
    }
  </script>
  
  <style>
    .wrap { width: 100%; height: 100%; min-height: 280px; }
    svg  { width: 100%; height: 100%; display: block; background: var(--bg, transparent); }
    .path  { fill: none; stroke: #ded2bf; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
    .start { fill: #6caa87; }
    .end   { fill: #df6d60; }
    .hint  { font: 14px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; fill: #888; }
  </style>
  
  <div class="wrap" bind:this={container}>
    <!-- 'none' removes internal letterboxing so we can fill height exactly -->
    <svg {viewBox} preserveAspectRatio="none" role="img" aria-label="Disc trajectory">
      {#if hasPath}
        <path class="path" d={d} />
        <circle class="start" cx={startX} cy={startY} r="4" />
        <circle class="end"   cx={endX}   cy={endY}   r="4" />
      {:else}
        <text class="hint" x={vw/2} y={vh/2} text-anchor="middle" dominant-baseline="middle">
          No points to draw
        </text>
      {/if}
    </svg>
  </div>
  