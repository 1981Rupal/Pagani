/**
 * Procedural V12 engine sound. Web Audio only, no recordings.
 *
 * Why synthesis: (1) no rights issues with a manufacturer's recording,
 * (2) it is *driven by the physics we explain*: the dominant pitch is the
 * firing frequency, rpm × cylinders ÷ 120.
 *
 * Signal graph (see ARCHITECTURE.md §6):
 *
 *   bankA osc ─┐
 *   bankB osc ─┼─ shaper ─ lowpass ─ body peak ─ engineGain ─┐
 *              │                                             │
 *   noise ─ bandpass ─ intakeGain ───────────────────────────┼─ comp ─ master ─ analyser ─ out
 *   whistle osc ─ whistleGain ───────────────────────────────┤
 *   noise ─ highpass ─ blowoffGain ──────────────────────────┘
 *
 * Must be created from a user gesture (Design.md §7: never autoplay).
 */

const CYLINDERS = 12;
export const IDLE_RPM = 900;
/** Synthesiser limiter, not a published redline. */
export const LIMIT_RPM = 6800;
export const PEAK_POWER_RPM = 6000;

export type EngineTelemetry = {
  rpm: number;
  throttle: number;
  boost: number;
  firingHz: number;
  running: boolean;
};

type Listener = (t: EngineTelemetry) => void;

export class EngineSynth {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private analyser!: AnalyserNode;
  private bankA!: OscillatorNode;
  private bankB!: OscillatorNode;
  private shaper!: WaveShaperNode;
  private lowpass!: BiquadFilterNode;
  private engineGain!: GainNode;
  private intakeFilter!: BiquadFilterNode;
  private intakeGain!: GainNode;
  private whistle!: OscillatorNode;
  private whistleGain!: GainNode;
  private noiseBuffer!: AudioBuffer;
  private blowoffFilter!: BiquadFilterNode;
  private blowoffGain!: GainNode;

  private raf = 0;
  private last = 0;
  private rpm = 0;
  private throttle = 0;
  private throttleTarget = 0;
  private boost = 0;
  private running = false;
  private stopping = false;
  private crankUntil = 0;
  private cutUntil = 0;
  private muted = false;
  private listeners = new Set<Listener>();

  get analyserNode() {
    return this.ctx ? this.analyser : null;
  }

  get isRunning() {
    return this.running;
  }

  onTelemetry(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  /** Call from a pointer/keyboard gesture. */
  async start() {
    if (this.running) return;
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    if (ctx.state === "suspended") await ctx.resume();
    this.running = true;
    this.stopping = false;
    this.rpm = 0;
    this.crankUntil = ctx.currentTime + 0.7; // starter motor
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, ctx.currentTime, 0.05);
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    if (!this.running) return;
    this.stopping = true;
    this.throttleTarget = 0;
  }

  setThrottle(v: number) {
    if (!this.running || this.stopping) return;
    const next = Math.max(0, Math.min(1, v));
    if (next < 0.2 && this.throttleTarget > 0.5 && this.boost > 0.45) this.blowoff();
    this.throttleTarget = next;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(m || !this.running ? 0 : 0.9, this.ctx.currentTime, 0.04);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.running = false;
    this.listeners.clear();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.ctx?.close();
    this.ctx = null;
  }

  // ---------------------------------------------------------------- graph

  private build() {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    comp.connect(this.master).connect(this.analyser).connect(ctx.destination);

    // One engine cycle = two crank revolutions. The oscillator runs at the cycle
    // frequency; the wave's harmonics place the energy at the firing order (12th)
    // and its sub-orders, which gives the V12 its texture.
    const wave = this.engineWave(ctx);
    this.bankA = ctx.createOscillator();
    this.bankB = ctx.createOscillator();
    this.bankA.setPeriodicWave(wave);
    this.bankB.setPeriodicWave(wave);
    this.bankB.detune.value = 7; // the second bank is never perfectly identical
    const bankBGain = ctx.createGain();
    bankBGain.gain.value = 0.7;

    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = this.driveCurve(2.2);
    this.shaper.oversample = "2x";

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = "lowpass";
    this.lowpass.Q.value = 0.8;

    const body = ctx.createBiquadFilter();
    body.type = "peaking";
    body.frequency.value = 170;
    body.Q.value = 1.1;
    body.gain.value = 7;

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    this.bankA.connect(this.shaper);
    this.bankB.connect(bankBGain).connect(this.shaper);
    this.shaper.connect(this.lowpass).connect(body).connect(this.engineGain).connect(comp);

    // Intake roar
    this.noiseBuffer = this.makeNoise(ctx, 2);
    const intakeNoise = ctx.createBufferSource();
    intakeNoise.buffer = this.noiseBuffer;
    intakeNoise.loop = true;
    this.intakeFilter = ctx.createBiquadFilter();
    this.intakeFilter.type = "bandpass";
    this.intakeFilter.Q.value = 1.4;
    this.intakeGain = ctx.createGain();
    this.intakeGain.gain.value = 0;
    intakeNoise.connect(this.intakeFilter).connect(this.intakeGain).connect(comp);

    // Turbo whistle
    this.whistle = ctx.createOscillator();
    this.whistle.type = "sine";
    this.whistleGain = ctx.createGain();
    this.whistleGain.gain.value = 0;
    this.whistle.connect(this.whistleGain).connect(comp);

    // Blow-off (air released when the throttle closes under boost)
    this.blowoffFilter = ctx.createBiquadFilter();
    this.blowoffFilter.type = "highpass";
    this.blowoffFilter.frequency.value = 1800;
    this.blowoffGain = ctx.createGain();
    this.blowoffGain.gain.value = 0;
    this.blowoffFilter.connect(this.blowoffGain).connect(comp);

    this.bankA.start();
    this.bankB.start();
    intakeNoise.start();
    this.whistle.start();

    // The physics runs on requestAnimationFrame, which pauses in hidden tabs.
    // Suspend audio with it so a backgrounded tab never drones on one note.
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) {
      this.throttleTarget = 0;
      this.ctx.suspend();
    } else if (this.running) {
      this.last = performance.now();
      this.ctx.resume();
    }
  };

  private engineWave(ctx: AudioContext) {
    const H = 96;
    const real = new Float32Array(H + 1);
    const imag = new Float32Array(H + 1);
    // Deterministic pseudo-random so every visitor hears the same engine.
    let seed = 1981;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let n = 1; n <= H; n++) {
      let a = 0.05 / Math.sqrt(n) * (0.5 + rand()); // combustion irregularity
      if (n % CYLINDERS === 0) a += 1.0 / (n / CYLINDERS); // firing order
      else if (n % 6 === 0) a += 0.42 / (n / 6); // bank-to-bank half order
      else if (n % 3 === 0) a += 0.12 / (n / 3);
      const phase = rand() * Math.PI * 2;
      real[n] = a * Math.cos(phase);
      imag[n] = a * Math.sin(phase);
    }
    return ctx.createPeriodicWave(real, imag);
  }

  private driveCurve(k: number) {
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(k * x) / Math.tanh(k);
    }
    return curve;
  }

  private makeNoise(ctx: AudioContext, seconds: number) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < d.length; i++) {
      // Lightly pinked noise
      b = 0.97 * b + 0.03 * (Math.random() * 2 - 1);
      d[i] = b * 6 + (Math.random() * 2 - 1) * 0.15;
    }
    return buf;
  }

  private blowoff() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.connect(this.blowoffFilter);
    const t = ctx.currentTime;
    const g = this.blowoffGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.linearRampToValueAtTime(0.28 * this.boost, t + 0.03);
    g.exponentialRampToValueAtTime(0.0001, t + 0.45);
    src.start(t, Math.random());
    src.stop(t + 0.5);
  }

  // ---------------------------------------------------------------- physics

  private tick = (now: number) => {
    const ctx = this.ctx;
    if (!ctx) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const t = ctx.currentTime;

    // Throttle has a little lag, like a real pedal and throttle body.
    this.throttle += (this.throttleTarget - this.throttle) * Math.min(1, dt * 14);

    if (t < this.crankUntil) {
      this.rpm = 220 + Math.sin(now / 38) * 60; // starter cranking
    } else if (this.stopping) {
      this.rpm = Math.max(0, this.rpm - 1400 * dt);
    } else {
      const free = this.rpm < IDLE_RPM ? 2600 : 0; // catch and flare on start
      const accel = this.throttle * 5600 * (1 - (this.rpm / (LIMIT_RPM * 1.08)) ** 3);
      const drag = 1700 + this.rpm * 0.32;
      this.rpm += (free + accel - (this.throttle < 0.05 ? drag : drag * 0.25)) * dt;
      if (this.rpm < IDLE_RPM) this.rpm += (IDLE_RPM - this.rpm) * Math.min(1, dt * 6);
      if (this.rpm >= LIMIT_RPM) {
        this.rpm = LIMIT_RPM - 260; // fuel cut bounce
        this.cutUntil = t + 0.06;
      }
      // Idle hunt
      if (this.throttle < 0.05) this.rpm += Math.sin(now / 260) * 4;
    }

    // Boost spools with load and rpm, and lags behind both.
    const boostTarget = this.throttle * Math.min(1, Math.max(0, (this.rpm - 1800) / 2600));
    this.boost += (boostTarget - this.boost) * Math.min(1, dt * (boostTarget > this.boost ? 2.2 : 5));

    const cycleHz = Math.max(0.5, this.rpm / 120);
    const load = this.throttle;
    const cut = t < this.cutUntil ? 0.25 : 1;
    const tau = 0.012;

    this.bankA.frequency.setTargetAtTime(cycleHz, t, tau);
    this.bankB.frequency.setTargetAtTime(cycleHz, t, tau);
    this.lowpass.frequency.setTargetAtTime(260 + this.rpm * 0.55 + load * 2200, t, tau);
    const level = this.rpm < 50 ? 0 : (0.22 + 0.5 * load + (this.rpm / LIMIT_RPM) * 0.25) * cut;
    this.engineGain.gain.setTargetAtTime(level, t, 0.02);

    this.intakeFilter.frequency.setTargetAtTime(500 + this.rpm * 0.45, t, tau);
    this.intakeGain.gain.setTargetAtTime(0.02 + load * (this.rpm / LIMIT_RPM) * 0.2, t, 0.03);

    this.whistle.frequency.setTargetAtTime(2400 + this.boost * 5200, t, 0.05);
    this.whistleGain.gain.setTargetAtTime(this.boost * 0.018, t, 0.05);

    const telemetry: EngineTelemetry = {
      rpm: this.rpm,
      throttle: this.throttle,
      boost: this.boost,
      firingHz: (this.rpm * CYLINDERS) / 120,
      running: this.running,
    };

    if (this.stopping && this.rpm <= 0) {
      this.running = false;
      this.stopping = false;
      this.engineGain.gain.setTargetAtTime(0, t, 0.05);
      this.intakeGain.gain.setTargetAtTime(0, t, 0.05);
      this.whistleGain.gain.setTargetAtTime(0, t, 0.05);
      this.master.gain.setTargetAtTime(0, t, 0.1);
      this.listeners.forEach((l) => l({ ...telemetry, rpm: 0, firingHz: 0, running: false }));
      return;
    }

    this.listeners.forEach((l) => l(telemetry));
    this.raf = requestAnimationFrame(this.tick);
  };
}

/** One engine per page. Design.md §7: one sound at a time. */
let singleton: EngineSynth | null = null;
export function getEngine() {
  if (!singleton) {
    singleton = new EngineSynth();
    singleton.onTelemetry((t) => Object.assign(liveTelemetry, t));
  }
  return singleton;
}
export function disposeEngine() {
  singleton?.dispose();
  singleton = null;
  Object.assign(liveTelemetry, { rpm: 0, throttle: 0, boost: 0, firingHz: 0, running: false });
}

/**
 * Latest telemetry, readable from inside useFrame without React renders.
 * The scene uses it to vibrate the engine block and spin the turbos.
 */
export const liveTelemetry: EngineTelemetry = { rpm: 0, throttle: 0, boost: 0, firingHz: 0, running: false };
