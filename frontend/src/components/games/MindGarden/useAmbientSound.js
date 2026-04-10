import { useEffect, useRef, useState } from 'react';

/**
 * Web Audio API hook for score-driven ambient drones and environment noise.
 */
export default function useAmbientSound(score, isMuted = true) {
  const audioCtxRef = useRef(null);
  const droneOscRef = useRef(null);
  const droneGainRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const noiseGainRef = useRef(null);
  
  const [isAudioReady, setIsAudioReady] = useState(false);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // --- Ambient Drone ---
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    oscGain.gain.setValueAtTime(0, ctx.currentTime);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    
    droneOscRef.current = osc;
    droneGainRef.current = oscGain;

    // --- Environment Noise (Cricket/Wind) ---
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    whiteNoise.start();

    noiseNodeRef.current = whiteNoise;
    noiseGainRef.current = nGain;

    setIsAudioReady(true);
  };

  // Handle mute/unmute
  useEffect(() => {
    if (!audioCtxRef.current) return;
    
    if (isMuted) {
      if (audioCtxRef.current.state !== 'suspended') {
        audioCtxRef.current.suspend();
      }
    } else {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    }
  }, [isMuted]);

  // Update sound based on score
  useEffect(() => {
    if (!audioCtxRef.current || isMuted) return;
    const ctx = audioCtxRef.current;
    
    // Ambient Drone Frequency
    let freq = 80;
    let vol = 0.04;
    
    if (score > 75) {
      freq = 180;
      vol = 0.05;
    } else if (score > 40) {
      freq = 120;
      vol = 0.06;
    }
    
    droneOscRef.current.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
    droneGainRef.current.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);

    // Noise (Cricket/Wind) - louder when score is low (night)
    const nVol = score < 35 ? 0.03 : 0.005;
    noiseGainRef.current.gain.setTargetAtTime(nVol, ctx.currentTime, 0.2);
    
  }, [score, isMuted, isAudioReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { initAudio, isAudioReady };
}
