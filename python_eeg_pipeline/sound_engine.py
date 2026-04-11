import os
import threading
import importlib

import numpy as np
import sounddevice as sd

SAMPLE_RATE = 44100
BLOCK_SIZE = 1024
CHANNELS = 2
INTERPOLATION_SPEED = 0.05


class SynthBase:
    """Base class for all audio generators with mute/solo debug flags."""

    def __init__(self):
        self.muted = False
        self.solo = False


class AudioFilePlayer(SynthBase):
    def __init__(self, file_path, pan=0.0):
        super().__init__()
        self.data = np.zeros((SAMPLE_RATE, 2), dtype="float32")
        if os.path.exists(file_path):
            try:
                librosa = importlib.import_module("librosa")
                data, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=False)
                data = data.T
                if data.ndim == 1:
                    data = np.column_stack([data, data])
                if data.shape[1] > 2:
                    data = data[:, :2]
                self.data = data
            except Exception as exc:
                print(f"Failed to load {file_path}: {exc}")

        self.read_pos = 0.0
        self.target_vol = 0.0
        self.current_vol = 0.0
        self.target_speed = 1.0
        self.current_speed = 1.0
        self.pan = pan

    def set_param(self, value):
        self.target_vol = min(1.0, value * 1.2)
        self.target_speed = 0.8 + (value * 0.7)

    def get_block(self):
        self.current_vol += (self.target_vol - self.current_vol) * INTERPOLATION_SPEED
        self.current_speed += (self.target_speed - self.current_speed) * INTERPOLATION_SPEED

        num_samples_needed = BLOCK_SIZE
        indices = self.read_pos + (np.arange(num_samples_needed) * self.current_speed)
        indices = indices % len(self.data)

        raw_block = self.data[indices.astype(int)]
        self.read_pos = (self.read_pos + (BLOCK_SIZE * self.current_speed)) % len(self.data)

        block = raw_block * self.current_vol
        block[:, 0] *= 1.0 - self.pan
        block[:, 1] *= 1.0 + self.pan
        return block


class PulsingDronePlayer(AudioFilePlayer):
    def __init__(self, file_path, pan=0.0):
        super().__init__(file_path, pan)
        self.target_pulse_speed = 0.0
        self.current_pulse_speed = 0.0
        self.pulse_phase_acc = 0.0

    def set_param(self, value):
        self.target_vol = 0.2 + (value * 0.6)
        if value > 0.4:
            self.target_pulse_speed = 4 + (value * 4)
        else:
            self.target_pulse_speed = 0.0

    def get_block(self):
        self.current_vol += (self.target_vol - self.current_vol) * INTERPOLATION_SPEED
        self.current_pulse_speed += (
            self.target_pulse_speed - self.current_pulse_speed
        ) * INTERPOLATION_SPEED

        num = BLOCK_SIZE
        indices = self.read_pos + np.arange(num)
        raw_block = self.data[(indices % len(self.data)).astype(int)]
        self.read_pos = (self.read_pos + num) % len(self.data)

        if self.current_pulse_speed > 0.1:
            phase_step = 2 * np.pi * self.current_pulse_speed / SAMPLE_RATE
            t = np.arange(num)
            current_phases = self.pulse_phase_acc + (t * phase_step)
            self.pulse_phase_acc += num * phase_step
            self.pulse_phase_acc %= 2 * np.pi

            modulator = 0.7 + (0.3 * np.sin(current_phases))
            raw_block *= modulator.reshape(-1, 1)

        block = raw_block * self.current_vol
        block[:, 0] *= 1.0 - self.pan
        block[:, 1] *= 1.0 + self.pan
        return block


class BinauralSynth(SynthBase):
    def __init__(self):
        super().__init__()
        self.phase_acc_l = 0.0
        self.phase_acc_r = 0.0
        self.target_base = 200
        self.current_base = 200
        self.target_beat = 10
        self.current_beat = 10
        self.target_amp = 0.0
        self.current_amp = 0.0

    def set_param(self, value):
        if value < 0.5:
            norm = value * 2
            self.target_beat = 4 + (norm * 8)
            self.target_base = 100 + (norm * 100)
        else:
            norm = (value - 0.5) * 2
            self.target_beat = 15 + (norm * 25)
            self.target_base = 200 + (norm * 200)
        self.target_amp = 0.2 if value > 0.01 else 0.0

    def get_block(self):
        self.current_beat += (self.target_beat - self.current_beat) * INTERPOLATION_SPEED
        self.current_base += (self.target_base - self.current_base) * INTERPOLATION_SPEED
        self.current_amp += (self.target_amp - self.current_amp) * INTERPOLATION_SPEED

        freq_l = self.current_base - self.current_beat / 2
        freq_r = self.current_base + self.current_beat / 2

        phase_step_l = 2 * np.pi * freq_l / SAMPLE_RATE
        phase_step_r = 2 * np.pi * freq_r / SAMPLE_RATE

        t = np.arange(BLOCK_SIZE)
        phases_l = self.phase_acc_l + (t * phase_step_l)
        phases_r = self.phase_acc_r + (t * phase_step_r)

        self.phase_acc_l = (self.phase_acc_l + BLOCK_SIZE * phase_step_l) % (2 * np.pi)
        self.phase_acc_r = (self.phase_acc_r + BLOCK_SIZE * phase_step_r) % (2 * np.pi)

        left = np.sin(phases_l)
        right = np.sin(phases_r)

        block = self.current_amp * np.concatenate(
            (left.reshape(-1, 1), right.reshape(-1, 1)), axis=1
        )
        return block


class PinkNoiseSynth(SynthBase):
    def __init__(self):
        super().__init__()
        self.target_amp = 0.0
        self.current_amp = 0.0

    def set_param(self, value):
        self.target_amp = (value * value) * 0.15

    def get_block(self):
        self.current_amp += (self.target_amp - self.current_amp) * INTERPOLATION_SPEED
        white = np.random.uniform(-1, 1, size=(BLOCK_SIZE, CHANNELS))
        output = np.cumsum(white, axis=0)
        max_val = np.max(np.abs(output))
        if max_val > 0:
            output = output / max_val
        return output * self.current_amp


class SoundEngine:
    def __init__(self, resource_dir: str):
        self.channels = [
            BinauralSynth(),
            AudioFilePlayer(os.path.join(resource_dir, "bird.mp3"), pan=-0.3),
            AudioFilePlayer(os.path.join(resource_dir, "rain.mp3"), pan=0.0),
            PulsingDronePlayer(os.path.join(resource_dir, "drone.mp3"), pan=0.3),
            PinkNoiseSynth(),
        ]
        self.channel_names = ["Binaural", "Bird", "Rain", "Drone", "Noise"]
        self.stream = sd.OutputStream(
            samplerate=SAMPLE_RATE,
            blocksize=BLOCK_SIZE,
            channels=CHANNELS,
            callback=self._callback,
        )
        self.lock = threading.Lock()
        self.running = False

    def start(self):
        if not self.running:
            self.stream.start()
            self.running = True

    def stop(self):
        if self.running:
            self.stream.stop()
            self.running = False

    def update_params(self, command: np.ndarray):
        with self.lock:
            for i, val in enumerate(command):
                if i < len(self.channels):
                    self.channels[i].set_param(float(val))

    def set_solo(self, channel_index: int):
        with self.lock:
            if channel_index < 0 or channel_index >= len(self.channels):
                for ch in self.channels:
                    ch.solo = False
            else:
                target_was_solo = self.channels[channel_index].solo
                for i, ch in enumerate(self.channels):
                    ch.solo = i == channel_index and not target_was_solo

    def toggle_mute(self, channel_index: int):
        with self.lock:
            if 0 <= channel_index < len(self.channels):
                self.channels[channel_index].muted = not self.channels[channel_index].muted

    def _callback(self, outdata, frames, time_info, status):
        with self.lock:
            mix = np.zeros((BLOCK_SIZE, CHANNELS), dtype=np.float32)

            any_solo = any(ch.solo for ch in self.channels)

            for ch in self.channels:
                block = ch.get_block()
                if ch.muted:
                    continue
                if any_solo and not ch.solo:
                    continue
                mix += block

            peak = np.max(np.abs(mix))
            if peak > 1.0:
                mix = mix / peak
            mix = np.tanh(mix)

            outdata[:] = mix
