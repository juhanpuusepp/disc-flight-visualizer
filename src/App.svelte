<script lang="ts">
  import Controls from './components/Controls.svelte';
  import Trajectory from './components/Trajectory.svelte';

  import { DEFAULT_PARAMS, type FlightParams, type Trajectory as TrajectoryPts } from './lib/types';
  import { computeTrajectory } from './lib/model';

  let params: FlightParams = DEFAULT_PARAMS;

  // Recompute path whenever params change
  let points: TrajectoryPts = [];
  $: points = computeTrajectory(params);
</script>

<main class="page">
  <header class="header">
    <h1>Disc Flight Visualizer</h1>
  </header>

  <section class="controls">
    <Controls value={params} on:change={(e) => (params = e.detail)} />
  </section>

  <section class="stage">
    <Trajectory {points} paddingPct={0.08} upIsPositiveY={true} />
  </section>

  <p class="caption">
    In discgolf, the flight numbers help do describe a disc's intended flight. Flight Ratings are broken into four main categories: Speed, Glide, Turn, & Fade. These characteristics can be used to rate various aspects of each disc’s flight. Each disc has a distinct "personality"; the flight path that makes that disc unique. Flight Ratings can be used to compare Innova golf discs to each other. Other companies have adopted a similar system, but it’s important to note that flight ratings shouldn’t be used to compare discs between brands since each company rates discs differently. Flight Ratings are based on right hand backhand (RHBH) throws.
  </p>
</main>

<style>
  .page {
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 16px;
    padding: 16px;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .header h1 {
    margin: 0;
    font: 600 20px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    text-align: center;
  }

  .controls {
    max-width: 500px;         /* keep inputs readable on big screens */
    margin-inline: auto;      /* center the controls row */
  }

  /* Drawing area */
  .stage {
    /* Prefer viewport height; never shorter than 320px */
    height: clamp(320px, 60vh, 900px);
    border: 1px solid #3b3b3b;
    border-radius: 12px;
    padding: 8px;
    background: #3b3b3b;
  }

  /* Tablet */
  @media (max-width: 900px) {
    .stage {
      height: clamp(360px, 70vh, 900px);
    }
  }

  /* Phone */
  @media (max-width: 600px) {
    .page { gap: 12px; padding: 12px; }
    .stage {
      height: clamp(380px, 80vh, 900px);  /* use more vertical space on phones */
      padding: 6px;
    }
  }

  .caption {
    margin-top: 50px;
    text-align: left;
    text-align: justify;
    color: #fffbfb47;
    font: 16px/1.3 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  }
</style>

