// Direcção visual: Picnic Pop — o motor expõe eventos simples para a camada React desenhar uma mesa de jogo táctil.
import Matter from "matter-js";
import { FRUITS, FruitDefinition, getFruit, pickNextFruit } from "./fruits";
import { GAME_CONFIG } from "./config";

export type GameSnapshot = { score: number; best: number; combo: number; next: FruitDefinition; over: boolean; paused: boolean; dangerMs: number };
export type Particle = { x: number; y: number; color: string; life: number; size: number; vx: number; vy: number };

type FruitBody = Matter.Body & { fruitLevel?: number; fruitId?: string; merged?: boolean };

export class FruitGame {
  readonly engine = Matter.Engine.create({ enableSleeping: true });
  readonly world = this.engine.world;
  readonly particles: Particle[] = [];
  private bodies: FruitBody[] = [];
  private walls: Matter.Body[] = [];
  private width = 360;
  private height = 560;
  private dangerTimer = 0;
  private lastMerge = 0;
  private comboValue = 0;
  private scoreValue = 0;
  private nextFruit = pickNextFruit(GAME_CONFIG.spawn.firstMaxLevel);
  private listeners = new Set<(snapshot: GameSnapshot) => void>();
  private onMergeListeners = new Set<(x: number, y: number, level: number) => void>();
  private audioEnabled = true;
  private gameOverValue = false;
  private pausedValue = false;
  private lastDropAt = 0;

  constructor() {
    this.engine.gravity.y = GAME_CONFIG.physics.gravity;
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      for (const pair of event.pairs) this.tryMerge(pair.bodyA as FruitBody, pair.bodyB as FruitBody);
    });
  }

  resize(width: number, height: number) {
    this.width = width; this.height = height;
    if (this.walls.length) Matter.Composite.remove(this.world, this.walls);
    const wall = (x: number, y: number, w: number, h: number) => Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, label: "wall", restitution: 0.15, friction: 0.6 });
    this.walls = [wall(width / 2, height + 18, width + 80, 36), wall(-18, height / 2, 36, height + 80), wall(width + 18, height / 2, 36, height + 80)];
    Matter.Composite.add(this.world, this.walls);
  }

  reset() {
    Matter.Composite.clear(this.world, false, true); this.bodies = []; this.walls = [];
    this.resize(this.width, this.height); this.scoreValue = 0; this.comboValue = 0; this.dangerTimer = 0; this.gameOverValue = false; this.pausedValue = false; this.lastDropAt = 0; this.nextFruit = pickNextFruit();
    this.emit();
  }

  setAudio(enabled: boolean) { this.audioEnabled = enabled; }
  subscribe(listener: (snapshot: GameSnapshot) => void) { this.listeners.add(listener); listener(this.snapshot()); return () => this.listeners.delete(listener); }
  onMerge(listener: (x: number, y: number, level: number) => void) { this.onMergeListeners.add(listener); return () => this.onMergeListeners.delete(listener); }
  togglePause() { if (!this.gameOverValue) { this.pausedValue = !this.pausedValue; this.emit(); } }
  private snapshot(): GameSnapshot { return { score: this.scoreValue, best: Number(localStorage.getItem("luli-best") || 0), combo: this.comboValue, next: this.nextFruit, over: this.gameOverValue, paused: this.pausedValue, dangerMs: this.dangerTimer }; }
  private emit() { const snapshot = this.snapshot(); this.listeners.forEach(listener => listener(snapshot)); }

  drop(x: number) {
    if (this.gameOverValue || this.pausedValue) return;

    const now = performance.now();
    const cooldownMs = 360;
    if (now - this.lastDropAt < cooldownMs) return;
    this.lastDropAt = now;

    const fruit = this.nextFruit; const body = Matter.Bodies.circle(Math.max(fruit.radius + 4, Math.min(this.width - fruit.radius - 4, x)), 42, fruit.radius, { restitution: GAME_CONFIG.physics.restitution, friction: GAME_CONFIG.physics.friction, frictionAir: GAME_CONFIG.physics.airFriction, density: fruit.mass / 100, label: "fruit" }) as FruitBody;
    body.fruitLevel = fruit.level; body.fruitId = fruit.id; Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);
    this.bodies.push(body); Matter.Composite.add(this.world, body); this.nextFruit = pickNextFruit(Math.min(GAME_CONFIG.spawn.maxLevel, GAME_CONFIG.spawn.firstMaxLevel - 1 + Math.floor(this.scoreValue / GAME_CONFIG.spawn.maxLevelIncreaseScore))); this.emit();
  }

  update(delta = 1000 / 60) {
    if (this.pausedValue || this.gameOverValue) return;
    Matter.Engine.update(this.engine, delta);
    const now = performance.now();
    const highest = this.bodies.reduce((value, body) => Math.min(value, body.position.y - (getFruit(body.fruitLevel || 1).radius)), this.height);
    const isInDangerZone = this.bodies.length > 0 && highest < GAME_CONFIG.danger.lineY;

    if (isInDangerZone) {
      if (this.dangerTimer <= 0) this.dangerTimer = GAME_CONFIG.danger.maxTimeMs;
      this.dangerTimer = Math.max(0, this.dangerTimer - delta);
      if (this.dangerTimer === 0) {
        this.gameOverValue = true;
        const best = Math.max(this.scoreValue, Number(localStorage.getItem("luli-best") || 0));
        localStorage.setItem("luli-best", String(best));
        this.emit();
      }
    } else {
      this.dangerTimer = 0;
    }

    if (this.comboValue && now - this.lastMerge > GAME_CONFIG.combo.resetAfterMs) { this.comboValue = 0; this.emit(); }
    for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.life -= delta / 700; p.x += p.vx; p.y += p.vy; p.vy += 0.08; if (p.life <= 0) this.particles.splice(i, 1); }
  }

  private tryMerge(a: FruitBody, b: FruitBody) {
    if (a.label !== "fruit" || b.label !== "fruit" || a.merged || b.merged || a.fruitLevel === undefined || b.fruitLevel === undefined || a.fruitLevel !== b.fruitLevel || a.fruitLevel >= FRUITS.length) return;
    a.merged = true; b.merged = true;
    const x = (a.position.x + b.position.x) / 2; const y = (a.position.y + b.position.y) / 2; const level = a.fruitLevel + 1;
    Matter.Composite.remove(this.world, a); Matter.Composite.remove(this.world, b); this.bodies = this.bodies.filter(body => body !== a && body !== b);
    const fruit = getFruit(level); const merged = Matter.Bodies.circle(x, y, fruit.radius, { restitution: GAME_CONFIG.physics.restitution, friction: GAME_CONFIG.physics.friction, frictionAir: GAME_CONFIG.physics.airFriction, density: fruit.mass / 100, label: "fruit" }) as FruitBody;
    merged.fruitLevel = level; merged.fruitId = fruit.id; Matter.Body.setVelocity(merged, { x: (Math.random() - 0.5) * 1.2, y: -2.4 }); Matter.Composite.add(this.world, merged); this.bodies.push(merged);
    this.comboValue = this.comboValue ? this.comboValue + 1 : 2; this.lastMerge = performance.now(); this.scoreValue += fruit.score * this.comboValue;
    for (let i = 0; i < 14; i++) this.particles.push({ x, y, color: i % 2 ? fruit.color : fruit.accent, life: 1, size: 2 + Math.random() * 4, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.8) * 4 });
    this.onMergeListeners.forEach(listener => listener(x, y, level)); this.emit();
    if (this.audioEnabled) this.beep(level);
  }

  private beep(level: number) {     try { const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = "sine"; osc.frequency.value = GAME_CONFIG.audio.baseFrequency + level * GAME_CONFIG.audio.levelStep; gain.gain.setValueAtTime(0.045, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + GAME_CONFIG.audio.mergeDuration); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + GAME_CONFIG.audio.mergeDuration); } catch { /* áudio é opcional */ } }
  getBodies() { return this.bodies; }
  getDangerRatio() { return this.dangerTimer > 0 ? 1 - (this.dangerTimer / GAME_CONFIG.danger.maxTimeMs) : 0; }
}
