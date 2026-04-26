import { useCallback, useEffect, useRef, useState } from 'react';
import { createSimulator } from '../../../utils/eegSimulator';

const DEFAULT_WS_URL = 'ws://localhost:8080';
const RECONNECT_MS = 3000;
const MAX_DELTA = 5;

function clampScore(n) {
  if (Number.isNaN(n) || n == null) return 0;
  return Math.min(100, Math.max(0, n));
}

function clampDelta(prev, next) {
  const d = next - prev;
  if (d > MAX_DELTA) return prev + MAX_DELTA;
  if (d < -MAX_DELTA) return prev - MAX_DELTA;
  return next;
}

/**
 * Streams attentionScore (+ optional bandPowers) from a dedicated game WebSocket.
 * Falls back to realistic EEG simulation when no server is available.
 *
 * @param {string} [wsUrl]              — WebSocket URL
 * @param {string} [simulatorProfile]   — one of PROFILES values for demo mode
 */
export function useAttentionScore(wsUrl = DEFAULT_WS_URL, simulatorProfile) {
  const [rawScore, setRawScore]             = useState(0);
  const [bandPowers, setBandPowers]         = useState(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [simPhase, setSimPhase]             = useState(null);
  const [simProfileName, setSimProfileName] = useState(null);

  const wsRef              = useRef(null);
  const reconnectTimerRef  = useRef(null);
  const simRafRef          = useRef(null);
  const simRef             = useRef(null);
  const lastClampedRef     = useRef(0);
  const mountedRef         = useRef(true);
  const hadLiveDataRef     = useRef(false);
  const wsUrlRef           = useRef(wsUrl);
  const lastFrameTimeRef   = useRef(null);

  wsUrlRef.current = wsUrl;

  // Sync simulator profile changes
  useEffect(() => {
    if (simRef.current && simulatorProfile) {
      simRef.current.setProfile(simulatorProfile);
      const state = simRef.current.getState();
      setSimProfileName(state.profileName);
    }
  }, [simulatorProfile]);

  const clearReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const stopSimulation = useCallback(() => {
    if (simRafRef.current != null) {
      cancelAnimationFrame(simRafRef.current);
      simRafRef.current = null;
    }
    lastFrameTimeRef.current = null;
  }, []);

  const applyIncomingScore = useCallback((value) => {
    const v = clampScore(Number(value));
    const clamped = clampDelta(lastClampedRef.current, v);
    lastClampedRef.current = clamped;
    setRawScore(clamped);
  }, []);

  const startSimulation = useCallback(() => {
    stopSimulation();

    // Create or reconfigure simulator
    if (!simRef.current) {
      simRef.current = createSimulator(simulatorProfile || undefined);
    } else if (simulatorProfile) {
      simRef.current.setProfile(simulatorProfile);
    }

    const state = simRef.current.getState();
    setSimProfileName(state.profileName);

    lastFrameTimeRef.current = null;

    const loop = (timestamp) => {
      if (!mountedRef.current) return;

      // Calculate delta time
      if (lastFrameTimeRef.current == null) {
        lastFrameTimeRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = timestamp;

      // Tick the simulator
      const result = simRef.current.tick(dt);

      // Apply ±5 clamp (double smoothing — intentional and realistic)
      const clamped = clampDelta(lastClampedRef.current, result.attentionScore);
      lastClampedRef.current = clamped;

      if (mountedRef.current) {
        setRawScore(clamped);
        setBandPowers(result.bandPowers);
        setSimPhase(result.phase);
      }

      simRafRef.current = requestAnimationFrame(loop);
    };

    simRafRef.current = requestAnimationFrame(loop);
  }, [stopSimulation, simulatorProfile]);

  const connectSocket = useCallback(() => {
    const url = wsUrlRef.current;
    clearReconnect();

    try {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    } catch {
      /* ignore */
    }

    setConnectionState((prev) =>
      hadLiveDataRef.current || prev === 'live' ? 'reconnecting' : 'connecting'
    );

    let socket;
    try {
      socket = new WebSocket(url);
    } catch {
      if (!hadLiveDataRef.current) {
        setConnectionState('simulated');
        startSimulation();
      } else {
        setConnectionState('reconnecting');
        reconnectTimerRef.current = window.setTimeout(connectSocket, RECONNECT_MS);
      }
      return;
    }

    wsRef.current = socket;

    socket.onopen = () => {
      stopSimulation();
      setConnectionState('live');
      setSimPhase(null);
      setSimProfileName(null);
    };

    socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const score =
          data.attentionScore ??
          data.attention_score ??
          data.score ??
          data.focus;
        if (typeof score === 'number' || typeof score === 'string') {
          hadLiveDataRef.current = true;
          applyIncomingScore(score);
        }
        if (data.bandPowers && typeof data.bandPowers === 'object') {
          setBandPowers(data.bandPowers);
        }
      } catch {
        /* ignore malformed */
      }
    };

    socket.onerror = () => {};

    socket.onclose = () => {
      wsRef.current = null;
      stopSimulation();
      if (!mountedRef.current) return;

      if (hadLiveDataRef.current) {
        setConnectionState('reconnecting');
        reconnectTimerRef.current = window.setTimeout(connectSocket, RECONNECT_MS);
      } else {
        setConnectionState('simulated');
        startSimulation();
      }
    };
  }, [
    applyIncomingScore,
    clearReconnect,
    startSimulation,
    stopSimulation,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    connectSocket();
    return () => {
      mountedRef.current = false;
      clearReconnect();
      stopSimulation();
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* ignore */
        }
        wsRef.current = null;
      }
    };
  }, [wsUrl, connectSocket, clearReconnect, stopSimulation]);

  return {
    rawScore,
    bandPowers,
    connectionState,
    isReconnecting: connectionState === 'reconnecting',
    isSimulated:    connectionState === 'simulated',
    phase:          connectionState === 'simulated' ? simPhase : null,
    profileName:    connectionState === 'simulated' ? simProfileName : null,
  };
}

export default useAttentionScore;
