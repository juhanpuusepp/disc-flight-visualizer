<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { FLIGHT_LIMITS, DEFAULT_PARAMS, type FlightParams, type IntRange } from '../lib/types';

  
    export let value: FlightParams = DEFAULT_PARAMS;
  
    const dispatch = createEventDispatcher<{ change: FlightParams }>();
  
    function clampToRange(n: number, r: IntRange) {
      let v = Math.round(Number.isFinite(n) ? n : r.min);
      if (v < r.min) v = r.min;
      if (v > r.max) v = r.max;
      return v;
    }
  
    function update<K extends keyof FlightParams>(key: K, raw: number) {
      const next: FlightParams = {
        ...value,
        [key]: clampToRange(raw, FLIGHT_LIMITS[key])
      } as FlightParams;
  
      value = next;               // reflect change locally
      dispatch('change', next);   // inform parent
    }
  </script>
  
  <style>
    .controls {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 12px;
      align-items: end;
    }
    label {
      display: grid;
      gap: 6px;
      font: 500 14px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    input[type="number"] {
      padding: 8px 10px;
      border: 1px solid #ccc;
      border-radius: 10px;
      font: 14px/1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      width: 100%;
    }
    small.hint { color: #666; font-size: 12px; }
  </style>
  
  <form class="controls" on:submit|preventDefault>
    <label for="speed">
      Speed
      <input
        id="speed"
        type="number"
        min={FLIGHT_LIMITS.speed.min}
        max={FLIGHT_LIMITS.speed.max}
        step={FLIGHT_LIMITS.speed.step}
        value={value.speed}
        on:input={(e) => update('speed', (e.currentTarget as HTMLInputElement).valueAsNumber)}
        inputmode="numeric"
      />
      <small class="hint">{FLIGHT_LIMITS.speed.min}–{FLIGHT_LIMITS.speed.max}</small>
    </label>
  
    <label for="glide">
      Glide
      <input
        id="glide"
        type="number"
        min={FLIGHT_LIMITS.glide.min}
        max={FLIGHT_LIMITS.glide.max}
        step={FLIGHT_LIMITS.glide.step}
        value={value.glide}
        on:input={(e) => update('glide', (e.currentTarget as HTMLInputElement).valueAsNumber)}
        inputmode="numeric"
      />
      <small class="hint">{FLIGHT_LIMITS.glide.min}–{FLIGHT_LIMITS.glide.max}</small>
    </label>
  
    <label for="turn">
      Turn
      <input
        id="turn"
        type="number"
        min={FLIGHT_LIMITS.turn.min}
        max={FLIGHT_LIMITS.turn.max}
        step={FLIGHT_LIMITS.turn.step}
        value={value.turn}
        on:input={(e) => update('turn', (e.currentTarget as HTMLInputElement).valueAsNumber)}
        inputmode="numeric"
      />
      <small class="hint">{FLIGHT_LIMITS.turn.min}…{FLIGHT_LIMITS.turn.max} (negative = more early right)</small>
    </label>
  
    <label for="fade">
      Fade
      <input
        id="fade"
        type="number"
        min={FLIGHT_LIMITS.fade.min}
        max={FLIGHT_LIMITS.fade.max}
        step={FLIGHT_LIMITS.fade.step}
        value={value.fade}
        on:input={(e) => update('fade', (e.currentTarget as HTMLInputElement).valueAsNumber)}
        inputmode="numeric"
      />
      <small class="hint">{FLIGHT_LIMITS.fade.min}–{FLIGHT_LIMITS.fade.max} (higher = stronger late left)</small>
    </label>
  </form>
  