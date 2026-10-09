import type { GraphView } from '../rendering/view';
import { radialPositions, RING_SPACING, type Position } from './radial.ts';
import { forceSimulation, forceManyBody, forceLink, forceCollide, type SimulationNodeDatum } from 'd3-force';

export interface Body extends SimulationNodeDatum { id: string; x: number; y: number; vx: number; vy: number }

const FIXED_STEP = 1 / 60;
const WAVE_DELAY = 0.45;
const RAMP_DURATION = 0.8;
const MAX_SPEED = 30;

function unitDirection(body: Body): Position {
  const radius = Math.hypot(body.x, body.y);
  if (radius > 0.001) return { x: body.x / radius, y: body.y / radius };
  const hash = [...body.id].reduce((value, letter) => value * 31 + letter.charCodeAt(0), 0);
  const angle = (hash % 360) * Math.PI / 180;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export class RadialSimulation {
  readonly bodies = new Map<string, Body>();
  origin: Position = { x: 0, y: 0 };
  generation = 0;
  elapsed = 0;
  activeLayer = 0;
  settled = false;
  temperature = 1;
  private view: GraphView | null = null;
  private active: Body[] = [];
  private accumulator = 0;
  private maxLayer = 0;
  private collision = forceCollide<Body>(18).iterations(2);
  private engine = forceSimulation<Body>().stop().alphaDecay(0).alpha(0.7).velocityDecay(0.35)
    .force('repulsion', forceManyBody<Body>().strength(-650).distanceMin(24).theta(0.9))
    .force('collision', this.collision);

  retarget(view: GraphView): void {
    const seeds = radialPositions(view);
    // Rebasing plus an equal display offset preserves every existing world position.
    const selected = this.bodies.get(view.root);
    const shift = selected ? { x: selected.x, y: selected.y } : { x: 0, y: 0 };
    for (const body of this.bodies.values()) {
      body.x -= shift.x; body.y -= shift.y;
      body.fx = null; body.fy = null;
    }
    this.origin = { x: this.origin.x + shift.x, y: this.origin.y + shift.y };
    this.view = view;
    this.active = view.words.map((id) => {
      let body = this.bodies.get(id);
      if (!body) {
        body = { id, ...seeds.get(id)!, vx: 0, vy: 0 };
        this.bodies.set(id, body);
      }
      return body;
    });
    const root = this.bodies.get(view.root)!;
    root.x = 0; root.y = 0; root.vx = 0; root.vy = 0; root.fx = 0; root.fy = 0;
    this.maxLayer = Math.max(0, ...view.words.map((word) => view.distances.get(word)!));
    this.generation++; this.elapsed = 0; this.accumulator = 0; this.activeLayer = 0;
    this.settled = false; this.temperature = 1;
    this.engine.alpha(0.7).velocityDecay(0.35);
    this.collision.strength(1);
    this.engine.force('links', null).nodes(this.active)
      .force('links', forceLink<Body, { source: string; target: string }>(view.edges.map(({ source, target }) => ({ source, target })))
        .id((body) => body.id).distance(95).strength(0.035))
      .force('radial', () => {
        for (const body of this.active) {
          if (body.id === this.view!.root) continue;
          const distance = this.view!.distances.get(body.id)!;
          const direction = unitDirection(body);
          const error = distance * RING_SPACING - Math.hypot(body.x, body.y);
          const force = Math.max(-8, Math.min(8, error * (0.003 + 0.11 * this.layerStrength(distance)))) * this.temperature;
          body.vx += direction.x * force; body.vy += direction.y * force;
          const speed = Math.hypot(body.vx, body.vy);
          if (speed > MAX_SPEED) { body.vx *= MAX_SPEED / speed; body.vy *= MAX_SPEED / speed; }
        }
      });
  }

  step(seconds: number): void {
    if (!this.view || this.settled || !Number.isFinite(seconds) || seconds <= 0) return;
    this.accumulator += Math.min(seconds, 0.05);
    while (this.accumulator + 1e-10 >= FIXED_STEP) {
      this.accumulator -= FIXED_STEP;
      this.elapsed += FIXED_STEP;
      this.activeLayer = Math.min(this.maxLayer, Math.floor(this.elapsed / WAVE_DELAY) + 1);
      const coolingStart = Math.max(0, this.maxLayer - 1) * WAVE_DELAY + RAMP_DURATION;
      this.temperature = Math.exp(-1.2 * Math.max(0, this.elapsed - coolingStart));
      this.engine.alpha(0.7 * this.temperature).velocityDecay(0.35 + 0.3 * (1 - this.temperature));
      this.collision.strength(this.temperature);
      this.origin.x *= Math.exp(-5 * FIXED_STEP); this.origin.y *= Math.exp(-5 * FIXED_STEP);
      this.engine.tick();
      for (const body of this.active) {
        if (body.id === this.view.root) continue;
        const distance = this.view.distances.get(body.id)!;
        const strength = this.layerStrength(distance);
        const direction = unitDirection(body);
        // Correct radius without locking angle; tangential velocity remains active.
        const correction = (distance * RING_SPACING - Math.hypot(body.x, body.y)) * 0.18 * strength;
        body.x += direction.x * correction; body.y += direction.y * correction;
        const radialVelocity = body.vx * direction.x + body.vy * direction.y;
        body.vx -= direction.x * radialVelocity * strength * 0.5;
        body.vy -= direction.y * radialVelocity * strength * 0.5;
      }
      if (this.temperature < 0.005) {
        for (const body of this.active) { body.vx = 0; body.vy = 0; }
        this.origin = { x: 0, y: 0 };
        this.settled = true;
        this.temperature = 0;
        this.accumulator = 0;
        break;
      }
    }
  }

  positions(): ReadonlyMap<string, Position> {
    return new Map(this.active.map((body) => [body.id, { x: body.x + this.origin.x, y: body.y + this.origin.y }]));
  }

  layerStrength(distance: number): number {
    const progress = Math.max(0, Math.min(1, (this.elapsed - (distance - 1) * WAVE_DELAY) / RAMP_DURATION));
    return progress * progress * (3 - 2 * progress);
  }

  instantSettle(): void {
    if (!this.view) return;
    for (const body of this.active) {
      const direction = unitDirection(body);
      const radius = this.view.distances.get(body.id)! * RING_SPACING;
      body.x = radius === 0 ? 0 : direction.x * radius;
      body.y = radius === 0 ? 0 : direction.y * radius;
      body.vx = 0; body.vy = 0;
    }
    this.origin = { x: 0, y: 0 };
    this.elapsed = this.maxLayer * WAVE_DELAY + RAMP_DURATION;
    this.activeLayer = this.maxLayer;
    this.settled = true;
    this.temperature = 0;
  }

  destroy(): void { this.engine.stop(); this.view = null; this.active = []; }
}
