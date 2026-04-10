# Tide Controller — Attention Game Documentation

**Tide Controller** is a full-screen neurofeedback mini-game in the Neurotune platform. The shoreline and tide respond to a **0–100 attention score**. Higher focus lowers the water and reveals buried artifacts; the UI is pure **SVG + CSS + `requestAnimationFrame`** (no canvas, no game engine).

**Source location:** `frontend/src/components/games/TideController/`

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [Demo mode (development)](#2-demo-mode-development)
3. [Production / live attention feed](#3-production--live-attention-feed)
4. [WebSocket protocol](#4-websocket-protocol)
5. [How the game works](#5-how-the-game-works)
6. [User interface](#6-user-interface)
7. [Session end and saving to Neurotune](#7-session-end-and-saving-to-neurotune)
8. [Embedding and configuration](#8-embedding-and-configuration)
9. [Operational behavior (edge cases)](#9-operational-behavior-edge-cases)
10. [Troubleshooting](#10-troubleshooting)
11. [File reference](#11-file-reference)

---

## 1. Quick start

### Open the game in the app

1. Sign in to Neurotune (register if needed so your user exists in MongoDB).
2. In the top navigation, choose **Tide Game**.
3. The game runs full-screen over the main layout. Use **Exit** to return to the dashboard.

### Run the stack locally

From the repository root:

```bash
npm run install-all
npm run dev
```

- **Frontend:** typically `http://localhost:5173`
- **Backend API:** typically `http://localhost:5000` (required for **Save Session** and login)

Ensure `frontend/.env` includes `VITE_API_BASE_URL` (see `frontend/.env.example`).

---

## 2. Demo mode (development)

### When demo mode is active

The game uses a **separate WebSocket** from the main Neurotune EEG stream:

- **Default URL:** `ws://localhost:8080`
- If the client **cannot connect** or the socket **closes before any live message** was ever received, the hook enters **simulated** mode.

You will see a badge: **“Demo mode (simulated EEG)”**.

### What demo mode does

- A **sine-based simulation** drives `attentionScore` between roughly **0 and 100** so designers and developers can test tide motion, artifact unlock timing, UI, and session flow **without** a score server.
- Incoming values are still **clamped to ±5 points per update** (relative to the previous value) to avoid harsh jumps, consistent with live mode.

### How to use demo mode intentionally

1. Start the app **without** any service listening on port **8080** (or point the game at a dead URL via the `wsUrl` prop).
2. Open **Tide Game** — simulation starts automatically after the failed connection.

No extra configuration is required.

### Optional: local score server for manual testing

If you want **manual** control instead of the built-in sine wave, run any WebSocket server on **8080** that sends JSON messages in the format described in [WebSocket protocol](#4-websocket-protocol). That is **not** demo mode; it is **live** mode to the game client.

---

## 3. Production / live attention feed

### Separation from the dashboard EEG WebSocket

| Channel | Default URL | Used by |
|--------|-------------|--------|
| Neurotune EEG (auth, Python relay) | `ws://localhost:5000/eeg-stream` (see `VITE_WS_URL`) | Dashboard, `LiveEEGMonitor`, session controls |
| **Tide Controller attention feed** | **`ws://localhost:8080`** (configurable) | Tide game only |

The Tide game **does not** read the dashboard’s `websocketService` connection. Production setups should run (or proxy to) a **dedicated service** that:

1. Accepts WebSocket connections from the browser (same origin, reverse proxy, or allowed CORS/WS host as appropriate).
2. Emits **JSON** messages containing at least `attentionScore` (see below).
3. Ideally sends updates at a steady rate (e.g. **10–30 Hz** or your pipeline’s natural rate); the client smooths over **3 seconds** and limits single-step jumps.

### Recommended production architecture

```text
EEG pipeline / BCI service
        │
        ▼
Attention estimator (0–100)
        │
        ▼
WebSocket server (Tide feed)  ◄── browser: TideController (wsUrl → wss://…)
```

- Use **`wss://`** behind TLS (e.g. Nginx, Caddy, or your cloud load balancer).
- Put the **WebSocket URL in configuration** (build-time `VITE_` env or runtime config) and pass it into `TideController` as **`wsUrl`** (see [Embedding and configuration](#8-embedding-and-configuration)).

### Security notes (production)

- Treat the attention stream like sensitive health-adjacent data: **TLS**, **authentication** (token in query, subprotocol, or first message), and **network policies** as required by your compliance model.
- The stock `useAttentionScore` hook connects **without** sending a JWT; extend the hook or wrap the server if you need auth.

---

## 4. WebSocket protocol

### Connection

- **Connect:** on component mount.
- **Disconnect:** on unmount (including React StrictMode double-mount cleanup).

### Message format (JSON text frames)

Minimum:

```json
{
  "attentionScore": 72.5
}
```

Optional:

```json
{
  "attentionScore": 72.5,
  "bandPowers": {
    "alpha": 1.2,
    "beta": 0.8,
    "theta": 0.5,
    "delta": 0.3,
    "gamma": 0.2
  }
}
```

### Accepted field aliases

The client also accepts (in order of preference):

- `attentionScore`
- `attention_score`
- `score`
- `focus`

Values are coerced to numbers and clamped to **0–100**.

### Processing pipeline (client-side)

1. **Per-update clamp:** change from the previous displayed value is limited to **±5** points per message (reduces visual whiplash from spikes).
2. **Rolling average:** a **3-second** rolling window smooths the stream; **all tide visuals and unlock logic** use this smoothed value.

---

## 5. How the game works

### Tide and score mapping

- **Score 0:** water fills about **90%** of the scene height (high tide).
- **Score 100:** water covers about **10%** (low tide).
- Mean waterline: `surfaceY = sceneHeight × (0.1 + 0.8 × score/100)`.
- The visible surface wiggles with **two superimposed sine waves** (different spatial frequencies and phase) updated every animation frame.

Water **color** shifts from deep teal (high water / low score) toward lighter aqua (low water / high score), driven by inline styles at frame rate.

### Artifacts

Six fixed seabed locations. Each has a **score threshold** and a short discovery story.

| # | Name | Unlock threshold (smoothed score) |
|---|------|-------------------------------------|
| 1 | Ancient Coin | > 30 |
| 2 | Compass Rose | > 42 |
| 3 | Message in a Bottle | > 55 |
| 4 | Brass Sextant | > 63 |
| 5 | Jade Amulet | > 74 |
| 6 | Shipwreck Figurehead | > 85 |

### Unlock rules

An artifact **unlocks** only when **both** are true **continuously for 4 seconds**:

1. **Smoothed score** is **strictly above** that artifact’s threshold.
2. The **mean tide line** has dropped enough that the seabed at that artifact is exposed: `baseSurfaceY > artifactY − 1` (see `artifacts.js` and `WaterLayer.jsx`).

On unlock:

- **Scale animation** from 0.5 → 1.0 over **600 ms** (ease-out).
- **Particle burst** (~11 small circles).

**Progress is session-persistent:** if focus drops and the tide covers an artifact again, it **submerges** (with a ripple) but remains **unlocked** for the rest of the session. Unlocked artifacts can be clicked to open the **artifact card**.

### Session length and end conditions

- **Default duration:** **5 minutes** (`sessionDurationMs` default `300000`).
- The session ends when **either**:
  - all **6** artifacts are unlocked, **or**
  - the timer reaches **zero**.

---

## 6. User interface

### HUD (top)

- **Top-left — Focus gauge:** semicircular 0–100 dial; needle transitions **200 ms**; zone-colored track (red / amber / teal); numeric value.
- **Top-right:**
  - **Reconnecting…** if live data was received earlier and the socket dropped (tide frozen at last score; no simulation).
  - **Demo mode (simulated EEG)** when never connected successfully.
  - **Session timer** (countdown `MM:SS`).
  - **Artifacts** counter `found / 6`.
  - **Discoveries** opens a drawer listing unlocked items with timestamps; tap an item to reopen its card.
  - **Exit** (when `onExit` is provided).

### Discoveries drawer and artifact card

- Unlocked artifacts are stored in **session state**.
- Each card shows **name**, **story**, and **Discovered at** (timestamp).

---

## 7. Session end and saving to Neurotune

When the session ends, an overlay shows:

- **Session portrait:** SVG sparkline of smoothed focus samples collected during the run.
- **Artifacts found** (n / 6).
- **Average focus** (mean of stored samples; falls back to current smoothed score if no samples).

### Save Session

- Calls **`POST /api/sessions`** with the same auth pattern as the rest of the app (`Authorization: Bearer <JWT>`).
- Payload aligns with the **Session** model, including:

  - `attentionScore` — rounded average focus  
  - `interventionType` — `'visual'`  
  - `taskContext` — `'TideController'`  
  - `sessionDuration` — **minutes** (derived from `sessionDurationMs`)  
  - `baselineScore`, `peakScore`, `averageScore`  
  - `notes` — includes artifact count  
  - `eegData` — `{ game: 'TideController', artifactsFound, tideHistorySample }`  

**Requirements:** user must be logged in; `VITE_API_BASE_URL` must point at the API (e.g. `http://localhost:5000/api`).

### Play Again

Resets session state, timer, discoveries, and tide history (artifacts remount via a new session key).

---

## 8. Embedding and configuration

### Component props (`TideController.jsx`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sessionDurationMs` | `number` | `300000` (5 min) | Session length in milliseconds. |
| `wsUrl` | `string` | `'ws://localhost:8080'` | Tide game attention WebSocket URL. Use `wss://` in production behind HTTPS. |
| `onExit` | `function` | optional | Called when the user clicks **Exit** (e.g. navigate back to dashboard). |

Example (production URL from env):

```jsx
<TideController
  wsUrl={import.meta.env.VITE_TIDE_WS_URL}
  sessionDurationMs={10 * 60 * 1000}
  onExit={() => setView('dashboard')}
/>
```

Add `VITE_TIDE_WS_URL` to `frontend/.env` / `.env.example` if you adopt this pattern.

---

## 9. Operational behavior (edge cases)

| Situation | Behavior |
|-----------|----------|
| **Tab hidden** (`document.visibilitychange`) | Tide **rAF** pauses (`running` false); simulation also stops when tab hidden. |
| **WebSocket drops after live data** | **Reconnecting…** badge; **last score held**; reconnection attempt every **3 s**; **no** sine demo. |
| **Never connected** | **Demo mode** sine simulation. |
| **Large score jump** | **±5** max change per incoming message (before rolling average). |
| **StrictMode** | Mount/unmount cleanup closes sockets and cancels animation frames to avoid duplicate connections. |
| **Responsive layout** | Scene uses SVG `viewBox` (`1000×700`) with `preserveAspectRatio` slice scaling for mobile/desktop. |

---

## 10. Troubleshooting

| Problem | Things to check |
|---------|-----------------|
| Always “Demo mode” | Nothing listening on `wsUrl`; firewall; wrong host/port; mixed content (HTTPS page needs `wss://`). |
| No tide motion | Tab focus hidden? Session ended? Check browser console for errors. |
| “Reconnecting…” forever | Server down after it was up; fix WS service or URL; CORS/proxy for WebSocket upgrade. |
| Save Session fails | Logged in? `VITE_API_BASE_URL` correct? Backend running? MongoDB reachable? |
| Artifacts never unlock | Threshold + 4 s sustained + mean waterline must clear spot; very low sustained scores keep tide high. |

---

## 11. File reference

| File | Role |
|------|------|
| `TideController.jsx` | Layout, session lifecycle, HUD, drawer, wiring. |
| `useAttentionScore.js` | WebSocket + simulation + reconnect + spike clamp. |
| `useRollingAverage.js` | 3 s rolling average. |
| `artifacts.js` | Artifact metadata, thresholds, SVG positions. |
| `SceneCanvas.jsx` | Sky, clouds, cliffs, beach decor. |
| `WaterLayer.jsx` | Clip-path water, dual sine surface, foam, tide color. |
| `ArtifactSpot.jsx` | Per-artifact unlock timer, submerge/ripple, particles. |
| `ArtifactCard.jsx` | Modal for one discovery. |
| `FocusGauge.jsx` | Semicircular HUD gauge. |
| `SessionEnd.jsx` | End screen, sparkline, save to API. |

---

## Appendix A — Minimal Node.js WebSocket broadcaster (local test)

Requires: `npm install ws`

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
let t = 0;
setInterval(() => {
  t += 0.15;
  const attentionScore = 50 + 45 * Math.sin(t * 0.2);
  const msg = JSON.stringify({
    attentionScore: Math.max(0, Math.min(100, attentionScore)),
    bandPowers: { alpha: 1, beta: 1, theta: 1, delta: 1, gamma: 1 },
  });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}, 50);

console.log('Tide demo WS on ws://localhost:8080');
```

This is **not** part of the repo; copy into a small script or service as needed.

---

*Last updated to match the implementation in the Neurotune repository (Tide Controller module).*
