const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

export default class BrowserSoundEngine {
  constructor() {
    this.audioContext = null;
    this.masterFilter = null;
    this.masterGain = null;

    this.binauralOsc = null;
    this.binauralGain = null;

    this.pulseOsc = null;
    this.pulseGain = null;
    this.pulseLfo = null;
    this.pulseLfoGain = null;

    this.rainSource = null;
    this.rainGain = null;

    this.droneOsc = null;
    this.droneGain = null;

    this.noiseSource = null;
    this.noiseGain = null;

    this.started = false;
  }

  _buildNoiseSource(context, seconds = 2) {
    const frameCount = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      channel[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  async start() {
    if (this.started && this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API is not available in this browser.');
    }

    const context = new AudioCtx();

    this.masterFilter = context.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 1800;
    this.masterFilter.Q.value = 0.7;

    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.masterFilter).connect(context.destination);

    this.binauralOsc = context.createOscillator();
    this.binauralOsc.type = 'sine';
    this.binauralOsc.frequency.value = 180;
    this.binauralGain = context.createGain();
    this.binauralGain.gain.value = 0;
    this.binauralOsc.connect(this.binauralGain).connect(this.masterGain);

    this.pulseOsc = context.createOscillator();
    this.pulseOsc.type = 'triangle';
    this.pulseOsc.frequency.value = 140;
    this.pulseGain = context.createGain();
    this.pulseGain.gain.value = 0;

    this.pulseLfo = context.createOscillator();
    this.pulseLfo.type = 'sine';
    this.pulseLfo.frequency.value = 2;
    this.pulseLfoGain = context.createGain();
    this.pulseLfoGain.gain.value = 0;
    this.pulseLfo.connect(this.pulseLfoGain).connect(this.pulseGain.gain);

    this.pulseOsc.connect(this.pulseGain).connect(this.masterGain);

    this.rainSource = this._buildNoiseSource(context);
    const rainFilter = context.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 600;

    const rainLow = context.createBiquadFilter();
    rainLow.type = 'lowpass';
    rainLow.frequency.value = 6000;

    this.rainGain = context.createGain();
    this.rainGain.gain.value = 0;
    this.rainSource.connect(rainFilter).connect(rainLow).connect(this.rainGain).connect(this.masterGain);

    this.droneOsc = context.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 70;
    this.droneGain = context.createGain();
    this.droneGain.gain.value = 0;
    this.droneOsc.connect(this.droneGain).connect(this.masterGain);

    this.noiseSource = this._buildNoiseSource(context);
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1200;
    noiseFilter.Q.value = 0.5;
    this.noiseGain = context.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseSource.connect(noiseFilter).connect(this.noiseGain).connect(this.masterGain);

    this.binauralOsc.start();
    this.pulseOsc.start();
    this.pulseLfo.start();
    this.rainSource.start();
    this.droneOsc.start();
    this.noiseSource.start();

    this.audioContext = context;
    this.started = true;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  setMasterVolume(volume01) {
    if (!this.masterGain || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const v = clamp01(volume01);
    this.masterGain.gain.setTargetAtTime(0.15 + 0.7 * v, now, 0.25);
  }

  updateParams(levels) {
    if (!this.started || !this.audioContext || !levels) return;

    const now = this.audioContext.currentTime;
    const binaural = clamp01(levels.binaural);
    const pulse = clamp01(levels.pulse);
    const rain = clamp01(levels.rain);
    const drone = clamp01(levels.drone);
    const noise = clamp01(levels.noise);

    this.binauralOsc.frequency.setTargetAtTime(150 + 180 * binaural, now, 0.2);
    this.binauralGain.gain.setTargetAtTime(0.03 + 0.10 * binaural, now, 0.25);

    this.pulseOsc.frequency.setTargetAtTime(95 + 90 * pulse, now, 0.2);
    this.pulseGain.gain.setTargetAtTime(0.006 + 0.07 * pulse, now, 0.25);
    this.pulseLfo.frequency.setTargetAtTime(0.6 + 3.5 * pulse, now, 0.25);
    this.pulseLfoGain.gain.setTargetAtTime(0.01 + 0.06 * pulse, now, 0.25);

    this.rainGain.gain.setTargetAtTime(0.02 + 0.10 * rain, now, 0.3);

    this.droneOsc.frequency.setTargetAtTime(60 + 40 * drone, now, 0.25);
    this.droneGain.gain.setTargetAtTime(0.05 + 0.08 * drone, now, 0.3);

    this.noiseGain.gain.setTargetAtTime(0.002 + 0.03 * noise * noise, now, 0.3);
  }

  async stop() {
    if (!this.audioContext) {
      this.started = false;
      return;
    }

    const stopNode = (node) => {
      if (!node) return;
      try {
        node.stop();
      } catch {
        // no-op
      }
      try {
        node.disconnect();
      } catch {
        // no-op
      }
    };

    stopNode(this.binauralOsc);
    stopNode(this.pulseOsc);
    stopNode(this.pulseLfo);
    stopNode(this.rainSource);
    stopNode(this.droneOsc);
    stopNode(this.noiseSource);

    try {
      await this.audioContext.close();
    } catch {
      // no-op
    }

    this.audioContext = null;
    this.masterFilter = null;
    this.masterGain = null;
    this.started = false;
  }
}
