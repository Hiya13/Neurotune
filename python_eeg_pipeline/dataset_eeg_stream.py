# python_eeg_pipeline/dataset_eeg_stream.py

import numpy as np
from scipy import signal
import os
import glob

SAMPLE_RATE = 128   # STEW dataset is recorded at 128 Hz
WINDOW_SIZE = 128   # 1 second of data = 128 samples
CHANNELS = [        # All 14 channel names in order
    'AF3', 'F7', 'F3', 'FC5', 'T7', 'P7', 'O1',
    'O2',  'P8', 'T8', 'FC6', 'F4', 'F8', 'AF4'
]

# Best channels for attention measurement (frontal + parietal)
# AF3, F3, F4, AF4 = frontal (attention/executive function)
# P7, P8 = parietal (attention/working memory)
ATTENTION_CHANNELS = [0, 2, 3, 5, 8, 11, 13]
# Indices of: AF3, F3, FC5, P7, P8, F4, AF4


class STEWDatasetStream:
    """
    Replaces SimulatedEEGStream with real STEW dataset data.

    Reads raw .txt files from the STEW dataset, computes Alpha/Beta/Theta
    band powers using Welch's method, and calculates attention score using
    the validated Pope (1995) Engagement Index: Beta / (Alpha + Theta)

    Usage:
        stream = STEWDatasetStream(dataset_folder='path/to/stew/files')
        snapshot = stream.step()
        # snapshot has: theta, alpha, beta, delta, gamma, focus, coherence
    """

    def __init__(self, dataset_folder, subject_id=1, use_task=True, loop=True):
        """
        dataset_folder : path to folder containing STEW .txt files
        subject_id     : which subject to load (1–48)
        use_task       : True = load task (hi) file, False = load rest (lo) file
        loop           : if True, loops back to start when data runs out
        """
        self.fs = SAMPLE_RATE
        self.window = WINDOW_SIZE
        self.loop = loop
        self.pointer = 0

        # Build filename — e.g. sub01_hi.txt or sub01_lo.txt
        task_str = 'hi' if use_task else 'lo'
        filename = f'sub{subject_id:02d}_{task_str}.txt'
        filepath = os.path.join(dataset_folder, filename)

        if not os.path.exists(filepath):
            raise FileNotFoundError(
                f"Could not find {filepath}\n"
                f"Make sure STEW dataset is in: {dataset_folder}"
            )

        print(f"[STEWDatasetStream] Loading: {filename}")
        self.raw_data = np.loadtxt(filepath)  # shape: (19200, 14)
        print(f"[STEWDatasetStream] Loaded {len(self.raw_data)} samples "
              f"({len(self.raw_data)/self.fs:.1f} seconds)")

        # Select only attention-relevant channels and average them
        # This gives one clean signal to compute band powers on
        self.eeg = self.raw_data[:, ATTENTION_CHANNELS]

        # Remove DC offset per channel (subtract mean)
        self.eeg = self.eeg - np.mean(self.eeg, axis=0)

        # Track last computed values for smooth output
        self._last = {
            'theta': 0.5, 'alpha': 0.5, 'beta': 0.3,
            'delta': 0.4, 'gamma': 0.2, 'focus': 50.0
        }

    @staticmethod
    def pope_engagement_index(theta, alpha, beta):
        """
        Pope, A.T., Bogart, E.H., Bartolome, D.S. (1995)
        Engagement Index = Beta / (Alpha + Theta)
        Normalized to 0-100 scale.
        """
        denominator = alpha + theta
        if denominator < 1e-10:
            return 50.0  # neutral fallback
        raw = beta / denominator
        # Typical EI range is 0.3–3.0, scale to 0–100
        return float(np.clip(raw * 30.0, 0.0, 100.0))

    def _compute_band_powers(self, eeg_window):
        """
        Compute power in each EEG band using Welch's method.
        Average across all selected attention channels.
        """
        band_powers = {}
        bands = {
            'delta': (0.5, 4.0),
            'theta': (4.0, 8.0),
            'alpha': (8.0, 13.0),
            'beta':  (13.0, 22.0),  # Pope 1995 uses 13-22 Hz for Beta
            'gamma': (30.0, 50.0),
        }

        # Compute per channel then average
        all_psds = []
        for ch in range(eeg_window.shape[1]):
            freqs, psd = signal.welch(
                eeg_window[:, ch],
                fs=self.fs,
                nperseg=min(self.window, len(eeg_window[:, ch]))
            )
            all_psds.append(psd)

        mean_psd = np.mean(all_psds, axis=0)  # average across channels

        for band, (lo, hi) in bands.items():
            mask = (freqs >= lo) & (freqs <= hi)
            if np.any(mask):
                power = float(np.trapezoid(mean_psd[mask], freqs[mask]))
            else:
                power = 0.0
            band_powers[band] = max(power, 1e-10)  # avoid zero division

        # Normalize so values are in a similar range to SimulatedEEGStream (0–1)
        total = sum(band_powers.values())
        for band in band_powers:
            band_powers[band] = float(np.clip(band_powers[band] / total, 0.0, 1.0))

        return band_powers, freqs, mean_psd

    def step(self, state=None, dt=1.0):
        """
        Returns one second of EEG data as band powers + focus score.
        Drop-in replacement for SimulatedEEGStream.step()

        The 'state' parameter is accepted for API compatibility
        but ignored — we use real data instead.
        """
        # Check if we have enough data
        end = self.pointer + self.window
        if end > len(self.eeg):
            if self.loop:
                self.pointer = 0  # loop back to start
                end = self.window
                print("[STEWDatasetStream] Looped back to start of file")
            else:
                # Return last known values when data runs out
                return dict(self._last)

        # Get 1-second window of raw EEG
        eeg_window = self.eeg[self.pointer:end]
        self.pointer += self.window  # advance by 1 second

        # Compute band powers
        band_powers, _, _ = self._compute_band_powers(eeg_window)

        theta = band_powers['theta']
        alpha = band_powers['alpha']
        beta  = band_powers['beta']
        delta = band_powers['delta']
        gamma = band_powers['gamma']

        # Pope 1995 Engagement Index
        focus = self.pope_engagement_index(theta, alpha, beta)

        # Simple coherence estimate (ratio of beta to total slow waves)
        coherence = float(np.clip(beta / (theta + alpha + 1e-5), 0.0, 1.0))

        result = {
            'theta':     theta,
            'alpha':     alpha,
            'beta':      beta,
            'delta':     delta,
            'gamma':     gamma,
            'focus':     focus,
            'coherence': coherence,
            'state':     'flow' if focus > 60 else 'distracted',
        }

        self._last = result
        return result

    def get_subject_info(self):
        """Returns info about the currently loaded file."""
        return {
            'total_samples': len(self.eeg),
            'duration_seconds': len(self.eeg) / self.fs,
            'channels_used': [CHANNELS[i] for i in ATTENTION_CHANNELS],
            'sample_rate': self.fs,
        }

    def reset(self, subject_id=None, use_task=None):
        """Reset pointer to beginning (useful for testing)."""
        self.pointer = 0
        print("[STEWDatasetStream] Reset to beginning")