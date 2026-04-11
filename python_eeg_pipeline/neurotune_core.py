import os
import threading
from enum import Enum

import numpy as np

try:
    import gymnasium as gym
    from gymnasium import spaces
    from stable_baselines3 import PPO
except Exception:
    gym = None
    spaces = None
    PPO = None


class SessionState(Enum):
    IDLE = "IDLE"
    BASELINE = "BASELINE"
    ACTIVE = "ACTIVE"
    ENDED = "ENDED"


class SessionStateMachine:
    """Simple baseline -> active state machine for closed-loop sessions."""

    def __init__(self, baseline_duration: float = 30.0):
        self.baseline_duration = baseline_duration
        self.state = SessionState.IDLE
        self.start_time = None
        self.focus_history = []
        self.baseline_focus = 0.0

    def start_session(self, now: float):
        self.state = SessionState.BASELINE
        self.start_time = now
        self.focus_history = []
        self.baseline_focus = 0.0

    def update(self, current_focus: float, now: float) -> SessionState:
        if self.state in (SessionState.IDLE, SessionState.ENDED):
            return self.state

        elapsed = now - self.start_time
        if self.state == SessionState.BASELINE:
            if elapsed >= self.baseline_duration:
                self.state = SessionState.ACTIVE
                if self.focus_history:
                    self.baseline_focus = float(sum(self.focus_history) / len(self.focus_history))
                else:
                    self.baseline_focus = 50.0
            else:
                self.focus_history.append(float(current_focus))

        return self.state

    def end_session(self):
        self.state = SessionState.ENDED


class SimulatedEEGStream:
    """High-fidelity EEG simulator using Kuramoto entrainment and pink-like drift."""

    def __init__(self, seed=None):
        if seed is not None:
            np.random.seed(seed)
        self.omega = np.array([6.0, 10.0, 20.0], dtype=np.float32) * 2.0 * np.pi
        self.phases = np.random.uniform(0, 2 * np.pi, 3).astype(np.float32)
        self.band_powers = np.array([0.5, 0.5, 0.5], dtype=np.float32)

    @staticmethod
    def calculate_focus_score(theta: float, alpha: float, beta: float) -> float:
        eps = 1e-5
        term1 = 0.55 * (beta / (theta + eps))
        term2 = 0.30 * (beta / (alpha + eps))
        term3 = 0.15 * (beta / (alpha + theta + eps))
        raw = term1 + term2 + term3
        return float(np.clip(raw * 20.0, 0.0, 100.0))

    def step(self, state: str = "distracted", dt: float = 1.0):
        # State-dependent coupling: flow => stronger coherence.
        k = 40.0 if state == "flow" else 2.0

        # Pink-like drift noise term.
        noise = np.random.normal(0.0, 5.0, 3)
        n = 3
        d_phases = np.zeros(n, dtype=np.float32)

        for i in range(n):
            coupling = float(np.sum(np.sin(self.phases - self.phases[i])))
            d_phases[i] = self.omega[i] + (k / n) * coupling + noise[i]

        self.phases = np.mod(self.phases + d_phases * dt, 2 * np.pi)

        coherence = float(np.abs(np.sum(np.exp(1j * self.phases))) / n)

        # Flow => beta-dominant, Distracted => alpha/theta-dominant
        if state == "flow":
            target = np.array([0.2, 0.2, 0.8 * coherence + 0.2], dtype=np.float32)
        else:
            target = np.array([0.5, 0.7 + 0.3 * (1.0 - coherence), 0.3 * coherence], dtype=np.float32)

        gamma = 0.15
        jitter = np.random.normal(0.0, 0.05, 3)
        self.band_powers = (1.0 - gamma) * self.band_powers + gamma * target + jitter
        self.band_powers = np.clip(self.band_powers, 0.05, 1.0)

        theta = float(self.band_powers[0])
        alpha = float(self.band_powers[1])
        beta = float(self.band_powers[2])

        # Derived approximate delta/gamma channels for dashboard compatibility
        delta = float(np.clip(0.55 * theta + 0.15 * (1.0 - coherence), 0.05, 1.0))
        gamma_band = float(np.clip(0.65 * beta + 0.15 * coherence, 0.05, 1.0))

        focus = self.calculate_focus_score(theta, alpha, beta)

        return {
            "theta": theta,
            "alpha": alpha,
            "beta": beta,
            "delta": delta,
            "gamma": gamma_band,
            "focus": focus,
            "coherence": coherence,
            "state": state,
        }


class _DummyEnv(gym.Env if gym else object):
    """Fallback env used only to initialize/load PPO policy structure."""

    def __init__(self):
        if spaces is None:
            return
        self.observation_space = spaces.Box(low=0.0, high=1.0, shape=(10,), dtype=np.float32)
        self.action_space = spaces.Box(low=0.0, high=1.0, shape=(5,), dtype=np.float32)

    def step(self, action):
        return np.zeros(10, dtype=np.float32), 0.0, False, False, {}

    def reset(self, seed=None, options=None):
        return np.zeros(10, dtype=np.float32), {}


class _ReplayTrainingEnv(gym.Env if gym else object):
    """Replay env that turns session traces into a learnable PPO objective."""

    def __init__(self, observations, target_actions, rewards):
        if spaces is None:
            return

        self.observations = np.asarray(observations, dtype=np.float32)
        self.target_actions = np.asarray(target_actions, dtype=np.float32)
        self.rewards = np.asarray(rewards, dtype=np.float32)

        self.observation_space = spaces.Box(low=0.0, high=1.0, shape=(10,), dtype=np.float32)
        self.action_space = spaces.Box(low=0.0, high=1.0, shape=(5,), dtype=np.float32)

        self._idx = 0

    def step(self, action):
        if self._idx >= len(self.observations) - 1:
            return self.observations[-1], 0.0, True, False, {}

        target = self.target_actions[self._idx]
        focus_term = float(self.rewards[self._idx])

        action = np.asarray(action, dtype=np.float32)
        mse = float(np.mean((action - target) ** 2))
        similarity = max(0.0, 1.0 - mse)

        # Combine user-focus improvement signal with action imitation stability.
        reward = 0.7 * focus_term + 0.3 * similarity

        self._idx += 1
        terminated = self._idx >= len(self.observations) - 1
        obs = self.observations[self._idx]
        return obs, float(reward), terminated, False, {}

    def reset(self, seed=None, options=None):
        self._idx = 0
        return self.observations[0], {}


class RLInferenceBridge:
    """PPO inference bridge aligned with current-repo worker behavior."""

    def __init__(self, model_path=None):
        self.model = None
        self.using_ppo = False
        self.has_external_model = False
        self._lock = threading.Lock()

        if PPO is None or gym is None or spaces is None:
            return

        env = _DummyEnv()
        if model_path and os.path.exists(model_path):
            try:
                self.model = PPO.load(model_path)
                self.using_ppo = True
                self.has_external_model = True
                return
            except Exception:
                self.model = None
                self.using_ppo = False
                self.has_external_model = False

        # Fallback to an initialized PPO policy (same approach as current repo worker).
        try:
            self.model = PPO("MlpPolicy", env, verbose=0)
            self.using_ppo = True
        except Exception:
            self.model = None
            self.using_ppo = False

    @staticmethod
    def _normalize_action(raw_action: np.ndarray) -> np.ndarray:
        raw_action = np.asarray(raw_action, dtype=np.float32)
        # Handle PPO outputs trained in either [-1,1] or [0,1] conventions.
        if np.min(raw_action) < 0.0 or np.max(raw_action) > 1.0:
            raw_action = (raw_action + 1.0) / 2.0
        return np.clip(raw_action, 0.0, 1.0)

    @staticmethod
    def _heuristic_action(
        theta: float,
        alpha: float,
        beta: float,
        current_focus: float,
        baseline_focus: float,
        last_action: np.ndarray,
    ) -> np.ndarray:
        # Focus deficit drives stimulation intensity adaptively.
        deficit = np.clip((baseline_focus - current_focus) / 100.0, 0.0, 1.0)
        spectral_drag = np.clip(alpha - beta, 0.0, 1.0)

        base = np.array([0.22, 0.16, 0.14, 0.20, 0.06], dtype=np.float32)
        deficit_boost = np.array([0.62, 0.38, 0.26, 0.34, 0.18], dtype=np.float32) * deficit
        spectral_boost = np.array([0.20, 0.10, 0.05, 0.08, 0.04], dtype=np.float32) * spectral_drag

        action = base + deficit_boost + spectral_boost

        # Temporal smoothing avoids abrupt changes in sound and state flips.
        smoothed = 0.6 * np.asarray(last_action, dtype=np.float32) + 0.4 * action
        shaped = np.power(np.clip(smoothed, 0.0, 1.0), 0.72)

        # Keep a small, audible floor so active phase does not collapse to silence.
        floors = np.array([0.18, 0.10, 0.09, 0.16, 0.05], dtype=np.float32)
        return np.maximum(shaped, floors)

    def predict(self, theta: float, alpha: float, beta: float, current_focus: float, baseline_focus: float, last_action: np.ndarray, phase: SessionState) -> np.ndarray:
        if phase != SessionState.ACTIVE:
            return np.zeros(5, dtype=np.float32)

        obs = np.array(
            [
                float(np.clip(theta, 0.0, 1.0)),
                float(np.clip(alpha, 0.0, 1.0)),
                float(np.clip(beta, 0.0, 1.0)),
                float(np.clip(current_focus / 100.0, 0.0, 1.0)),
                float(np.clip(baseline_focus / 100.0, 0.0, 1.0)),
                *np.clip(last_action, 0.0, 1.0),
            ],
            dtype=np.float32,
        )

        if self.model is not None and self.using_ppo:
            try:
                with self._lock:
                    raw_action, _ = self.model.predict(obs, deterministic=True)
                action = self._normalize_action(raw_action)

                # If no external trained model is available and PPO collapses to near-zero,
                # fall back to adaptive heuristic to keep closed-loop behavior meaningful.
                if (not self.has_external_model) and float(np.mean(action)) < 0.05:
                    return self._heuristic_action(
                        theta, alpha, beta, current_focus, baseline_focus, last_action
                    )

                return action
            except Exception:
                return self._heuristic_action(
                    theta, alpha, beta, current_focus, baseline_focus, last_action
                )

        return self._heuristic_action(
            theta, alpha, beta, current_focus, baseline_focus, last_action
        )

    def train_on_session(self, samples, save_path=None, total_timesteps=768):
        """Fine-tune the policy on session replay data and persist for returning users."""
        if PPO is None or gym is None or spaces is None:
            return False, "PPO/Gymnasium unavailable"

        if not samples or len(samples) < 32:
            return False, "Not enough active-phase samples"

        observations = np.asarray([s["obs"] for s in samples], dtype=np.float32)
        target_actions = np.asarray([s["action"] for s in samples], dtype=np.float32)
        rewards = np.asarray([s["reward"] for s in samples], dtype=np.float32)
        rewards = np.clip(rewards, -1.0, 1.0)

        env = _ReplayTrainingEnv(observations, target_actions, rewards)
        train_steps = int(max(256, min(4096, total_timesteps)))

        try:
            with self._lock:
                if self.model is None or not self.using_ppo:
                    self.model = PPO("MlpPolicy", env, verbose=0)
                    self.using_ppo = True
                else:
                    self.model.set_env(env)

                self.model.learn(total_timesteps=train_steps, reset_num_timesteps=False, progress_bar=False)

                if save_path:
                    save_dir = os.path.dirname(save_path)
                    if save_dir:
                        os.makedirs(save_dir, exist_ok=True)
                    self.model.save(save_path)
                    self.has_external_model = True

            return True, f"Trained {train_steps} steps on {len(samples)} samples"
        except Exception as exc:
            return False, f"Training failed: {exc}"
