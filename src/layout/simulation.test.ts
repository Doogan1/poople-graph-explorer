import { expect, it } from 'vitest';
import { buildGraph } from '../graph/topology';
import { bfs } from '../graph/traversal';
import { selectView } from '../rendering/view';
import { RING_SPACING } from './radial';
import { RadialSimulation } from './simulation';

const graph = buildGraph(['cold', 'cord', 'bold', 'bord', 'zzzz']);
const view = (root: string, radius = 2) => selectView(graph, bfs(graph, root), radius);

it('pins the local root and maintains finite positions and bounded velocity over long runs', () => {
  const sim = new RadialSimulation();
  sim.retarget(view('cold'));
  expect(sim.bodies.size).toBe(4);
  for (let frame = 0; frame < 900; frame++) {
    sim.step(1 / 60);
    expect(sim.bodies.get('cold')).toMatchObject({ x: 0, y: 0, vx: 0, vy: 0 });
    for (const body of sim.bodies.values()) {
      expect([body.x, body.y, body.vx, body.vy].every(Number.isFinite)).toBe(true);
      expect(Math.hypot(body.vx, body.vy)).toBeLessThanOrEqual(30.0001);
    }
  }
  sim.destroy();
});

it('preserves displayed positions on re-root and preserves non-root velocities', () => {
  const sim = new RadialSimulation();
  sim.retarget(view('cold'));
  for (let frame = 0; frame < 20; frame++) sim.step(1 / 60);
  const before = sim.positions();
  const velocity = { vx: sim.bodies.get('cord')!.vx, vy: sim.bodies.get('cord')!.vy };
  sim.retarget(view('bold'));
  for (const [word, position] of before) {
    expect(sim.positions().get(word)!.x).toBeCloseTo(position.x);
    expect(sim.positions().get(word)!.y).toBeCloseTo(position.y);
  }
  expect(sim.bodies.get('cord')).toMatchObject(velocity);
  expect(sim.bodies.get('bold')).toMatchObject({ x: 0, y: 0 });
  expect(Math.hypot(sim.origin.x, sim.origin.y)).toBeGreaterThan(0);
  for (let frame = 0; frame < 300; frame++) sim.step(1 / 60);
  expect(Math.hypot(sim.origin.x, sim.origin.y)).toBeLessThan(0.01);
  sim.destroy();
});

it('supersedes old schedules and activates radial constraints outward', () => {
  const sim = new RadialSimulation();
  sim.retarget(view('cold'));
  for (let frame = 0; frame < 25; frame++) sim.step(1 / 60);
  expect(sim.layerStrength(1)).toBeGreaterThan(sim.layerStrength(2));
  sim.retarget(view('bord'));
  sim.retarget(view('cord'));
  expect(sim.generation).toBe(3);
  expect(sim.elapsed).toBe(0);
  sim.step(1 / 60);
  expect(sim.bodies.get('cord')).toMatchObject({ x: 0, y: 0 });
  sim.destroy();
});

it('bounds elapsed integration after tab suspension and supports instant settling', () => {
  const sim = new RadialSimulation();
  sim.retarget(view('cold'));
  sim.step(60);
  expect(sim.elapsed).toBeLessThanOrEqual(0.05);
  sim.retarget(view('bord'));
  sim.instantSettle();
  expect(sim.origin).toEqual({ x: 0, y: 0 });
  for (const [word, point] of sim.positions()) {
    expect(Math.hypot(point.x, point.y)).toBeCloseTo(view('bord').distances.get(word)! * RING_SPACING);
    expect(sim.bodies.get(word)).toMatchObject({ vx: 0, vy: 0 });
  }
  sim.destroy();
});

it('keeps cached identities across view changes and handles isolates', () => {
  const sim = new RadialSimulation();
  sim.retarget(view('cold'));
  const cached = sim.bodies.get('bord');
  sim.retarget(view('cold', 0));
  expect(sim.positions().size).toBe(1);
  sim.retarget(view('cold'));
  expect(sim.bodies.get('bord')).toBe(cached);
  sim.retarget(view('zzzz'));
  sim.instantSettle();
  sim.step(1 / 60);
  expect([...sim.positions()]).toEqual([['zzzz', { x: 0, y: 0 }]]);
  sim.destroy();
});

it('keeps angular motion available after the radial wave completes', () => {
  const sim = new RadialSimulation();
  sim.retarget(view('cold'));
  for (let frame = 0; frame < 120; frame++) sim.step(1 / 60);
  const body = sim.bodies.get('cord')!;
  const angle = Math.atan2(body.y, body.x);
  body.vx = -body.y / RING_SPACING * 4;
  body.vy = body.x / RING_SPACING * 4;
  sim.step(1 / 60);
  expect(Math.atan2(body.y, body.x)).not.toBe(angle);
  sim.destroy();
});

it('cools to a stationary layout and reheats on a new root without resetting positions', () => {
  const sim = new RadialSimulation();
  sim.retarget(view('cold'));
  sim.step(1 / 60);
  expect(sim.temperature).toBe(1);
  for (let frame = 0; frame < 360; frame++) sim.step(1 / 60);
  expect(sim.temperature).toBeLessThan(0.1);
  for (let frame = 0; frame < 600; frame++) sim.step(1 / 60);
  expect(sim.settled).toBe(true);
  const before = sim.positions();
  sim.step(1);
  expect(sim.positions()).toEqual(before);
  sim.retarget(view('bold'));
  expect(sim.settled).toBe(false);
  expect(sim.temperature).toBe(1);
  for (const [word, position] of before) {
    expect(sim.positions().get(word)!.x).toBeCloseTo(position.x);
    expect(sim.positions().get(word)!.y).toBeCloseTo(position.y);
  }
  sim.destroy();
});
