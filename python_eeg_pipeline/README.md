# Python EEG Neurofeedback Pipeline

This directory contains the Python pipeline for real-time EEG data processing and neurofeedback.

## Features

- Real-time EEG signal processing
- Brain wave band power calculation (Alpha, Beta, Theta, Delta, Gamma)
- Attention score calculation using validated formula
- Binaural beat generation for neurofeedback
- WebSocket communication with Node.js backend
- Automatic session data logging to MongoDB

## Requirements

- Python 3.8 or higher
- EEG device (Muse, OpenBCI, Emotiv, etc.)
- Audio output device for sound feedback

## Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

1. Open `eeg_neurofeedback.py`
2. Update the configuration at the bottom:
   - `USER_ID`: Your user ID from the web application
   - `API_KEY`: Python API key from backend `.env` file
   - `WS_URL`: WebSocket server URL (default: ws://localhost:5000/eeg-stream)
   - `API_URL`: REST API URL (default: http://localhost:5000/api)

## Usage

```bash
python eeg_neurofeedback.py
```

The pipeline will:
1. Connect to the WebSocket server
2. Wait for session start command from React frontend
3. Begin reading EEG data and streaming to dashboard
4. Generate therapeutic sound based on attention levels
5. Save session data when stopped

## EEG Device Integration

The current code uses **simulated EEG data**. Replace the `read_eeg_data()` method with your actual EEG device code.

### Example: Muse Headband

```python
from muselsl import stream, list_muses
from pylsl import StreamInlet, resolve_byprop

def read_eeg_data(self):
    # Connect to Muse stream
    streams = resolve_byprop('type', 'EEG', timeout=2)
    inlet = StreamInlet(streams[0])
    
    # Pull sample
    sample, timestamp = inlet.pull_sample()
    return sample, 256  # Muse samples at 256 Hz
```

### Example: OpenBCI

```python
from brainflow import BoardShim, BrainFlowInputParams

def read_eeg_data(self):
    params = BrainFlowInputParams()
    board = BoardShim(0, params)  # 0 = Cyton board
    board.prepare_session()
    board.start_stream()
    
    data = board.get_board_data()
    eeg_channels = BoardShim.get_eeg_channels(0)
    eeg_data = data[eeg_channels[0]]  # First channel
    
    return eeg_data, BoardShim.get_sampling_rate(0)
```

## Attention Score Formula

The attention score is calculated using:

```
Attention Score = [(Beta + Alpha) / (Theta + Delta)] × 10
```

Normalized to 0-100 scale where:
- **0-50**: Low attention (needs intervention)
- **50-75**: Moderate attention (maintain)
- **75-100**: High attention (optimal state)

## Sound Feedback

The pipeline generates binaural beats based on attention levels:

- **Low Attention (<50)**: 20 Hz beat (Beta - Alertness)
- **Moderate (50-75)**: 10 Hz beat (Alpha - Focused relaxation)
- **High (>75)**: 6 Hz beat (Theta - Deep focus)

## Customization

### Modify Frequency Bands

Edit the `compute_band_powers()` method:

```python
bands = {
    'delta': (0.5, 4),
    'theta': (4, 8),
    'alpha': (8, 13),
    'beta': (13, 30),
    'gamma': (30, 50)
}
```

### Adjust Update Rate

Change the sleep duration in `stream_eeg_loop()`:

```python
time.sleep(0.2)  # 200ms = 5 updates per second
```

### Custom Attention Formula

Modify `calculate_attention_score()` with your own algorithm:

```python
def calculate_attention_score(self, band_powers):
    # Your custom formula here
    score = your_calculation(band_powers)
    return min(100, max(0, score))
```

## Troubleshooting

### WebSocket Connection Failed
- Ensure backend server is running
- Check `WS_URL` is correct
- Verify firewall settings

### No Sound Output
- Check audio device is connected
- Verify `sounddevice` is installed correctly
- Test with: `python -m sounddevice`

### EEG Device Not Found
- Install device-specific drivers
- Check USB connection
- Run device's test utility first

## Data Flow

```
EEG Device → Python Pipeline → Node.js WebSocket → React Dashboard
                ↓
            MongoDB (via REST API)
```

## License

This code is for educational purposes.
