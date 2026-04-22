/**
 * eegSimulator.js — Realistic EEG attention simulation engine.
 *
 * Pure JS, framework-agnostic, StrictMode-safe (no module-level mutable state).
 * All state lives inside the returned simulator instance.
 */

// ── Profile catalogue ────────────────────────────────────
export const PROFILES = {
  FOCUSED_STUDENT: 'focused-student',
  RESTLESS_MIND:   'restless-mind',
  MEDITATOR:       'meditator',
  GAMER:           'gamer',
  TIRED_PRO:       'tired-professional',
  ADHD_PATTERN:    'child-adhd',
};

export const PROFILE_LABELS = {
  [PROFILES.FOCUSED_STUDENT]: 'Focused Student',
  [PROFILES.RESTLESS_MIND]:   'Restless Mind',
  [PROFILES.MEDITATOR]:       'Meditator',
  [PROFILES.GAMER]:           'Gamer',
  [PROFILES.TIRED_PRO]:       'Tired Professional',
  [PROFILES.ADHD_PATTERN]:    'Child / ADHD',
};

/** Pre-computed 30-point sparkline arrays for each profile */
export const PROFILE_SPARKLINES = {
  [PROFILES.FOCUSED_STUDENT]: [52,55,60,65,70,73,75,74,72,70,68,72,74,75,28,32,45,58,65,68,70,72,74,75,76,74,72,75,78,76],
  [PROFILES.RESTLESS_MIND]:   [45,38,52,48,60,42,55,48,38,65,58,42,50,38,62,45,38,55,48,40,58,52,38,60,42,50,38,55,48,42],
  [PROFILES.MEDITATOR]:       [58,62,65,67,70,71,72,72,71,73,74,73,72,74,75,74,73,75,76,75,74,76,77,76,75,77,78,77,76,78],
  [PROFILES.GAMER]:           [42,45,52,60,68,72,65,78,62,85,70,58,88,72,65,78,55,82,70,62,75,68,90,72,65,80,75,68,72,78],
  [PROFILES.TIRED_PRO]:       [50,48,45,42,40,38,36,40,38,35,38,40,42,38,35,38,45,52,58,62,58,52,48,44,40,38,42,40,38,42],
  [PROFILES.ADHD_PATTERN]:    [45,28,65,38,82,25,70,42,88,32,60,22,75,45,90,28,55,38,78,20,65,42,85,30,58,45,80,25,62,48],
};

const ALL_PROFILE_KEYS = Object.values(PROFILES);

// ── Profile definitions ──────────────────────────────────
const PROFILE_CONFIGS = {
  [PROFILES.FOCUSED_STUDENT]: {
    baseline: 62,
    startScore: 55,
    lapseInterval:  [25, 40],
    lapseDepth:     [8, 15],
    lapseDuration:  [3, 6],
    deepFocusChance: 0.12,
    deepFocusDuration: [20, 35],
    deepFocusLevel: [72, 82],
    distractionChance: 0.008,
    distractionDepth: [25, 35],
    distractionDuration: [12, 18],
    noiseScale: 1.0,
    rampSpeed: 0.6,
    targetDrift: 0.02,
  },
  [PROFILES.RESTLESS_MIND]: {
    baseline: 45,
    startScore: 45,
    lapseInterval:  [12, 20],
    lapseDepth:     [10, 18],
    lapseDuration:  [4, 8],
    deepFocusChance: 0.03,
    deepFocusDuration: [10, 18],
    deepFocusLevel: [68, 80],
    distractionChance: 0.018,
    distractionDepth: [28, 40],
    distractionDuration: [10, 18],
    noiseScale: 1.4,
    rampSpeed: 0.5,
    targetDrift: 0.04,
  },
  [PROFILES.MEDITATOR]: {
    baseline: 70,
    startScore: 58,
    lapseInterval:  [50, 70],
    lapseDepth:     [5, 10],
    lapseDuration:  [3, 5],
    deepFocusChance: 0.15,
    deepFocusDuration: [35, 50],
    deepFocusLevel: [74, 82],
    distractionChance: 0.003,
    distractionDepth: [38, 48],
    distractionDuration: [8, 12],
    noiseScale: 0.6,
    rampSpeed: 0.35,
    targetDrift: 0.01,
  },
  [PROFILES.GAMER]: {
    baseline: 58,
    startScore: 42,
    lapseInterval:  [18, 30],
    lapseDepth:     [10, 20],
    lapseDuration:  [3, 5],
    deepFocusChance: 0.10,
    deepFocusDuration: [15, 25],
    deepFocusLevel: [80, 95],
    distractionChance: 0.012,
    distractionDepth: [30, 42],
    distractionDuration: [6, 12],
    noiseScale: 1.3,
    rampSpeed: 0.9,
    targetDrift: 0.035,
  },
  [PROFILES.TIRED_PRO]: {
    baseline: 42,
    startScore: 50,
    lapseInterval:  [15, 25],
    lapseDepth:     [8, 16],
    lapseDuration:  [5, 10],
    deepFocusChance: 0.04,
    deepFocusDuration: [15, 25],
    deepFocusLevel: [58, 68],
    distractionChance: 0.015,
    distractionDepth: [22, 35],
    distractionDuration: [18, 30],
    noiseScale: 1.1,
    rampSpeed: 0.4,
    targetDrift: 0.03,
  },
  [PROFILES.ADHD_PATTERN]: {
    baseline: 50,
    startScore: 45,
    lapseInterval:  [8, 15],
    lapseDepth:     [12, 25],
    lapseDuration:  [2, 5],
    deepFocusChance: 0.06,
    deepFocusDuration: [8, 15],
    deepFocusLevel: [75, 92],
    distractionChance: 0.025,
    distractionDepth: [15, 35],
    distractionDuration: [5, 10],
    noiseScale: 1.8,
    rampSpeed: 1.2,
    targetDrift: 0.06,
  },
};

// ── Drift speeds per phase ───────────────────────────────
const DRIFT_SPEED = {
  rising:       0.8,
  plateau:      0.15,
  lapse:        2.5,
  recovery:     0.6,
  distraction:  1.8,
  deepFocus:    0.4,
};

// ── Helpers ──────────────────────────────────────────────
function clamp(v, lo, hi)    { return Math.max(lo, Math.min(hi, v)); }
function randRange(rng, a, b) { return a + rng() * (b - a); }
function randInt(rng, a, b)   { return Math.floor(randRange(rng, a, b + 1)); }

/** Simple seedable PRNG (mulberry32). Falls back to Math.random. */
function createRng(seed) {
  if (seed == null) return Math.random;
  let s = seed | 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Band power derivation ────────────────────────────────
function deriveBandPowers(score, phase, rng) {
  const r = score / 100;
  const n = (scale) => (rng() - 0.5) * 2 * scale;

  let beta  = 0.3 + r * 0.7  + n(0.05);
  let alpha = 0.8 - r * 0.4  + n(0.08);
  let theta = 0.9 - r * 0.6  + n(0.06);
  let delta = 0.6 - r * 0.3  + n(0.04);
  let gamma = 0.1 + r * 0.3  + n(0.07);

  // Phase modifiers
  if (phase === 'distraction') { theta += 0.3; beta -= 0.2; }
  if (phase === 'deepFocus')   { beta += 0.25; theta -= 0.2; }
  if (phase === 'lapse')       { alpha += 0.2; beta -= 0.15; }

  const c = (v) => clamp(v, 0.05, 1.5);
  return { alpha: c(alpha), beta: c(beta), theta: c(theta), delta: c(delta), gamma: c(gamma) };
}


// ── Main factory ─────────────────────────────────────────
/**
 * Creates a simulator instance.
 * @param {string}  [profileName] — one of PROFILES values, or random
 * @param {number}  [seed]        — integer seed for deterministic output (for testing)
 * @returns {{ tick, reset, setProfile, getState }}
 */
export function createSimulator(profileName, seed) {
  const rng = createRng(seed);

  // Pick profile
  let profileKey = profileName && PROFILE_CONFIGS[profileName]
    ? profileName
    : ALL_PROFILE_KEYS[Math.floor(rng() * ALL_PROFILE_KEYS.length)];

  let cfg = PROFILE_CONFIGS[profileKey];

  // ── Internal mutable state ────────────────────────
  let currentScore, baselineScore, phase, phaseTimer, sessionTime,
      lapseCountdown, deepFocusActive, targetScore, prevOutput;

  function initState() {
    currentScore    = cfg.startScore;
    baselineScore   = cfg.baseline;
    phase           = 'rising';
    phaseTimer      = randRange(rng, 4, 12);
    sessionTime     = 0;
    lapseCountdown  = randRange(rng, cfg.lapseInterval[0], cfg.lapseInterval[1]);
    deepFocusActive = false;
    targetScore     = cfg.baseline + randRange(rng, -5, 10);
    prevOutput      = currentScore;
  }

  initState();

  // ── Phase transition logic ────────────────────────
  function advancePhase() {
    switch (phase) {
      case 'rising':
        phase = 'plateau';
        phaseTimer = randRange(rng, 8, 25);
        targetScore = baselineScore + randRange(rng, -3, 8);
        break;

      case 'plateau':
        // Natural baseline drift
        baselineScore += (rng() - 0.5) * cfg.targetDrift * 60;
        baselineScore = clamp(baselineScore, cfg.baseline - 15, cfg.baseline + 15);
        phase = 'plateau';
        phaseTimer = randRange(rng, 5, 15);
        targetScore = baselineScore + randRange(rng, -5, 5);
        break;

      case 'lapse':
        phase = 'recovery';
        phaseTimer = randRange(rng, 3, 8);
        targetScore = baselineScore + randRange(rng, -3, 5);
        break;

      case 'recovery':
        phase = 'plateau';
        phaseTimer = randRange(rng, 6, 18);
        targetScore = baselineScore + randRange(rng, -2, 6);
        break;

      case 'distraction':
        phase = 'recovery';
        phaseTimer = randRange(rng, 5, 12);
        targetScore = baselineScore - randRange(rng, 0, 5);
        break;

      case 'deepFocus':
        deepFocusActive = false;
        phase = 'plateau';
        phaseTimer = randRange(rng, 5, 12);
        targetScore = baselineScore + randRange(rng, 0, 5);
        break;

      default:
        phase = 'plateau';
        phaseTimer = 10;
    }
  }

  // ── Tick ───────────────────────────────────────────
  function tick(dt) {
    if (dt <= 0 || dt > 1) dt = 1/60; // safety

    sessionTime += dt;

    // 1. Advance timers
    phaseTimer -= dt;
    if (phaseTimer <= 0) advancePhase();

    // 2. Lapse countdown
    lapseCountdown -= dt;
    if (lapseCountdown <= 0 && phase === 'plateau') {
      phase = 'lapse';
      const depth = randRange(rng, cfg.lapseDepth[0], cfg.lapseDepth[1]);
      targetScore = currentScore - depth;
      phaseTimer = randRange(rng, cfg.lapseDuration[0], cfg.lapseDuration[1]);
      lapseCountdown = randRange(rng, cfg.lapseInterval[0], cfg.lapseInterval[1]);
    }

    // 3. Random distraction event
    if (phase === 'plateau' && rng() < cfg.distractionChance) {
      phase = 'distraction';
      targetScore = randRange(rng, cfg.distractionDepth[0], cfg.distractionDepth[1]);
      phaseTimer = randRange(rng, cfg.distractionDuration[0], cfg.distractionDuration[1]);
    }

    // 4. Random deep focus zone
    if (phase === 'plateau' && !deepFocusActive && rng() < cfg.deepFocusChance * dt) {
      phase = 'deepFocus';
      deepFocusActive = true;
      targetScore = randRange(rng, cfg.deepFocusLevel[0], cfg.deepFocusLevel[1]);
      phaseTimer = randRange(rng, cfg.deepFocusDuration[0], cfg.deepFocusDuration[1]);
    }

    // 5. Baseline slow drift
    baselineScore += (rng() - 0.5) * cfg.targetDrift * dt * 10;
    baselineScore = clamp(baselineScore, 15, 90);

    // 6. Organic drift toward target
    const speed = DRIFT_SPEED[phase] || 0.5;
    currentScore += (targetScore - currentScore) * speed * dt;

    // 7. Biological noise
    const noiseMultiplier = 1 + (1 - currentScore / 100) * 0.5;
    const noise = (rng() - 0.5) * 4 * cfg.noiseScale * noiseMultiplier;
    currentScore += noise * dt * 6;

    // 8. ±5 clamp from previous output (smoothing)
    currentScore = clamp(currentScore, prevOutput - 5, prevOutput + 5);

    // 9. Final 0–100 clamp
    currentScore = clamp(currentScore, 0, 100);
    prevOutput = currentScore;

    const attentionScore = Math.round(currentScore * 100) / 100;
    const bandPowers = deriveBandPowers(attentionScore, phase, rng);

    return {
      attentionScore,
      bandPowers,
      phase,
      profileName: profileKey,
    };
  }

  function reset() {
    initState();
  }

  function setProfile(name) {
    if (PROFILE_CONFIGS[name]) {
      profileKey = name;
      cfg = PROFILE_CONFIGS[name];
      initState();
    }
  }

  function getState() {
    return {
      currentScore, baselineScore, phase, phaseTimer,
      sessionTime, deepFocusActive, profileName: profileKey,
    };
  }

  return { tick, reset, setProfile, getState };
}
