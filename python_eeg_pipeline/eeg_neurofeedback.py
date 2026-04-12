# Python EEG Pipeline Requirements
# Install these packages:
# pip install websocket-client numpy scipy sounddevice requests

import json
import os
import time
import threading
import websocket
import numpy as np
from scipy import signal
import requests

from neurotune_core import RLInferenceBridge, SessionState, SessionStateMachine, SimulatedEEGStream
from sound_engine import SoundEngine

class EEGNeurofeedbackPipeline:
    def __init__(self, user_id, api_key, ws_url='ws://localhost:5000/eeg-stream', api_url='http://localhost:5000/api'):
        self.user_id = user_id
        self.api_key = api_key
        self.ws_url = ws_url
        self.api_url = api_url
        
        self.ws = None
        self.is_running = False
        self.is_sound_active = False
        self.intervention_type = 'none'
        self.sound_volume = 50
        
        # Session data
        self.session_data = {
            'attentionScores': [],
            'alphaPowers': [],
            'betaPowers': [],
            'thetaPowers': [],
            'deltaPowers': [],
            'timestamps': [],
            'taskContext': '',
            'startTime': None,
            'endTime': None
        }
        
        # Sound generation
        self.sound_thread = None
        self.sample_rate = 44100
        self.update_interval = 1.0  # 1Hz telemetry, aligned with current repo
        self.sound_engine = SoundEngine(resource_dir=os.path.dirname(os.path.abspath(__file__)))

        # Closed-loop core modules (ported from personal NeuroTune repo)
        self.flow_threshold = 0.16
        self.session_phase = SessionState.IDLE.value
        self.last_action = np.zeros(5, dtype=np.float32)
        self.last_audio_command = np.zeros(5, dtype=np.float32)
        self.state_machine = SessionStateMachine(baseline_duration=30.0)
        self.eeg_simulator = SimulatedEEGStream()

        # Per-user persistent model path: used automatically for returning users.
        self.user_models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'user_models')
        os.makedirs(self.user_models_dir, exist_ok=True)

        explicit_model_path = os.getenv('NEUROTUNE_PPO_MODEL_PATH')
        default_model_stem = os.path.join(self.user_models_dir, f'{self.user_id}_ppo_model')
        default_model_exists = os.path.exists(default_model_stem) or os.path.exists(f'{default_model_stem}.zip')

        load_model_path = explicit_model_path or (default_model_stem if default_model_exists else None)
        self.model_save_path = explicit_model_path or default_model_stem

        self.rl_agent = RLInferenceBridge(model_path=load_model_path)
        self.training_samples = []
        self.enable_online_training = os.getenv('NEUROTUNE_ENABLE_ONLINE_TRAINING', '1').lower() not in ('0', 'false', 'no')
        self.training_steps = int(os.getenv('NEUROTUNE_ONLINE_TRAIN_STEPS', '768'))

        mode = 'PPO inference' if self.rl_agent.using_ppo else 'heuristic fallback'
        source = load_model_path if load_model_path else 'new/fallback policy'
        print(f"NeuroTune core initialized ({mode}) from {source}")
        
    def connect_websocket(self):
        """Connect to WebSocket server"""
        def on_message(ws, message):
            data = json.loads(message)
            print(f"Received: {data['type']}")
            
            if data['type'] == 'REGISTER_SUCCESS':
                print("✓ Python client registered successfully")
                
            elif data['type'] == 'SESSION_CONTROL':
                if data['action'] == 'start':
                    print(f"Starting session with intervention: {data.get('parameters', {}).get('interventionType', 'none')}")
                    self.start_session(data.get('parameters', {}))
                elif data['action'] == 'stop':
                    print("Stopping session...")
                    self.stop_session()
                    
            elif data['type'] == 'SOUND_CONTROL':
                self.handle_sound_control(data)
        
        def on_error(ws, error):
            print(f"WebSocket error: {error}")
        
        def on_close(ws, close_status_code, close_msg):
            print("WebSocket connection closed")
            self.is_running = False
        
        def on_open(ws):
            print("WebSocket connection established")
            # Register as Python client
            ws.send(json.dumps({
                'type': 'PYTHON_REGISTER',
                'apiKey': self.api_key,
                'userId': self.user_id
            }))
        
        self.ws = websocket.WebSocketApp(
            self.ws_url,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close,
            on_open=on_open
        )
        
        # Run WebSocket in separate thread
        ws_thread = threading.Thread(target=self.ws.run_forever)
        ws_thread.daemon = True
        ws_thread.start()
        
        time.sleep(2)  # Wait for connection
    
    def read_eeg_data(self):
        """
        Read EEG data from your device.
        This is a PLACEHOLDER - replace with your actual EEG device code.
        Example devices: Muse, OpenBCI, Emotiv, etc.
        """
        # SIMULATED DATA - Replace with actual EEG reading
        # Example: raw_data = your_eeg_device.read_data()
        
        # Simulate 256 Hz sampling rate
        duration = 1.0  # 1 second window
        fs = 256  # Sampling frequency
        t = np.linspace(0, duration, int(fs * duration))
        
        # Simulate EEG signal with different frequency components
        alpha_freq = 10  # 8-13 Hz
        beta_freq = 20   # 13-30 Hz
        theta_freq = 6   # 4-8 Hz
        delta_freq = 2   # 0.5-4 Hz
        
        # Create synthetic EEG signal
        signal_data = (
            np.sin(2 * np.pi * alpha_freq * t) * 2 +
            np.sin(2 * np.pi * beta_freq * t) * 1.5 +
            np.sin(2 * np.pi * theta_freq * t) * 1 +
            np.sin(2 * np.pi * delta_freq * t) * 0.5 +
            np.random.normal(0, 0.5, len(t))  # Noise
        )
        
        return signal_data, fs
    
    def compute_band_powers(self, eeg_data, fs):
        """Compute power in different frequency bands"""
        # Define frequency bands
        bands = {
            'delta': (0.5, 4),
            'theta': (4, 8),
            'alpha': (8, 13),
            'beta': (13, 30),
            'gamma': (30, 50)
        }
        
        # Compute power spectral density
        freqs, psd = signal.welch(eeg_data, fs, nperseg=min(256, len(eeg_data)))
        
        # Calculate power in each band
        band_powers = {}
        for band, (low, high) in bands.items():
            freq_mask = (freqs >= low) & (freqs <= high)
            if np.any(freq_mask):
                # Use trapezoid integration (numpy 2.0+ uses trapezoid, older uses trapz)
                if hasattr(np, 'trapezoid'):
                    band_powers[band] = np.trapezoid(psd[freq_mask], freqs[freq_mask])
                else:
                    band_powers[band] = np.trapz(psd[freq_mask], freqs[freq_mask])
            else:
                band_powers[band] = 0
            
        return band_powers
    
    def calculate_attention_score(self, band_powers):
        """
        Calculate attention score based on brain wave patterns.
        Formula: (Beta + Alpha) / (Theta + Delta)
        Higher score = better attention
        """
        numerator = band_powers['beta'] + band_powers['alpha']
        denominator = band_powers['theta'] + band_powers['delta']
        
        if denominator == 0:
            return 0
        
        raw_score = (numerator / denominator) * 10
        
        # Normalize to 0-100 scale
        attention_score = min(100, max(0, raw_score))
        
        return attention_score
    


    def stream_eeg_loop(self):
        """Main loop for reading EEG and streaming data"""
        print("Starting EEG streaming loop...")
        
        while self.is_running:
            try:
                tick_start = time.time()

                # 1) Sense: run brain-state simulator
                brain_state = 'flow' if float(self.last_action[0]) >= self.flow_threshold else 'distracted'
                eeg_snapshot = self.eeg_simulator.step(state=brain_state, dt=self.update_interval)

                band_powers = {
                    'theta': float(eeg_snapshot['theta']),
                    'alpha': float(eeg_snapshot['alpha']),
                    'beta': float(eeg_snapshot['beta']),
                    'delta': float(eeg_snapshot['delta']),
                    'gamma': float(eeg_snapshot['gamma']),
                }

                # 2) Think: focus score + session state update + RL action
                attention_score = float(eeg_snapshot['focus'])
                phase = self.state_machine.update(attention_score, tick_start)
                self.session_phase = phase.value

                action = self.rl_agent.predict(
                    theta=band_powers['theta'],
                    alpha=band_powers['alpha'],
                    beta=band_powers['beta'],
                    current_focus=attention_score,
                    baseline_focus=self.state_machine.baseline_focus,
                    last_action=self.last_action,
                    phase=phase,
                )

                # Respect intervention mode from frontend controls
                if self.intervention_type not in ('auditory', 'multi-modal'):
                    action = np.zeros(5, dtype=np.float32)

                self.last_action = np.clip(np.asarray(action, dtype=np.float32), 0.0, 1.0)
                self.is_sound_active = self.intervention_type in ('auditory', 'multi-modal')

                if phase == SessionState.ACTIVE:
                    obs = np.array(
                        [
                            float(np.clip(band_powers['theta'], 0.0, 1.0)),
                            float(np.clip(band_powers['alpha'], 0.0, 1.0)),
                            float(np.clip(band_powers['beta'], 0.0, 1.0)),
                            float(np.clip(attention_score / 100.0, 0.0, 1.0)),
                            float(np.clip(self.state_machine.baseline_focus / 100.0, 0.0, 1.0)),
                            *np.clip(self.last_action, 0.0, 1.0),
                        ],
                        dtype=np.float32,
                    )
                    reward = float(np.clip((attention_score - self.state_machine.baseline_focus) / 100.0, -1.0, 1.0))
                    self.training_samples.append(
                        {
                            'obs': obs,
                            'action': np.array(self.last_action, dtype=np.float32),
                            'reward': reward,
                        }
                    )
                    if len(self.training_samples) > 4096:
                        self.training_samples = self.training_samples[-4096:]

                # Apply a soft ambient bed + smoothing so sound stays pleasant and continuous.
                volume_scale = max(0.0, min(1.0, float(self.sound_volume) / 100.0))
                if self.is_sound_active:
                    if phase == SessionState.BASELINE:
                        bed = np.array([0.14, 0.02, 0.10, 0.14, 0.0], dtype=np.float32)
                        target_audio = bed
                    else:
                        shaped = np.array(self.last_action, dtype=np.float32)
                        # Keep pulse/noise softer to avoid harshness.
                        shaped[1] *= 0.60
                        shaped[4] *= 0.35

                        bed = np.array([0.18, 0.03, 0.12, 0.18, 0.01], dtype=np.float32)
                        target_audio = np.maximum(bed, shaped)

                    smoothed_audio = 0.68 * self.last_audio_command + 0.32 * target_audio
                    self.last_audio_command = np.clip(smoothed_audio, 0.0, 1.0)
                    audio_command = self.last_audio_command * volume_scale
                else:
                    self.last_audio_command = np.zeros(5, dtype=np.float32)
                    audio_command = np.zeros(5, dtype=np.float32)
                
                # Store for session summary
                self.session_data['attentionScores'].append(attention_score)
                self.session_data['alphaPowers'].append(band_powers['alpha'])
                self.session_data['betaPowers'].append(band_powers['beta'])
                self.session_data['thetaPowers'].append(band_powers['theta'])
                self.session_data['deltaPowers'].append(band_powers['delta'])
                self.session_data['timestamps'].append(tick_start)
                
                # 3) Act: update sound engine channels
                self.sound_engine.update_params(audio_command)
                
                # Send data to React via WebSocket
                if self.ws and self.ws.sock and self.ws.sock.connected:
                    payload = {
                        'type': 'EEG_DATA',
                        'userId': self.user_id,
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                        'attentionScore': round(attention_score, 2),
                        'focusScore': round(attention_score, 2),
                        'alpha': round(band_powers['alpha'], 2),
                        'beta': round(band_powers['beta'], 2),
                        'theta': round(band_powers['theta'], 2),
                        'delta': round(band_powers['delta'], 2),
                        'gamma': round(band_powers['gamma'], 2),
                        'sessionPhase': self.session_phase,
                        'baselineFocus': round(float(self.state_machine.baseline_focus), 2),
                        'audioLevels': {
                            'binaural': round(float(audio_command[0]), 3),
                            'pulse': round(float(audio_command[1]), 3),
                            'rain': round(float(audio_command[2]), 3),
                            'drone': round(float(audio_command[3]), 3),
                            'noise': round(float(audio_command[4]), 3),
                        },
                        'isSoundActive': self.is_sound_active,
                        'interventionType': self.intervention_type
                    }
                    
                    self.ws.send(json.dumps(payload))
                
                # Sleep for update interval (e.g., 200ms = 5 Hz update rate)
                elapsed = time.time() - tick_start
                time.sleep(max(0.01, self.update_interval - elapsed))
                
            except Exception as e:
                print(f"Error in EEG loop: {e}")
                time.sleep(1)
        
        print("EEG streaming loop stopped")
    
    def start_session(self, parameters):
        """Start EEG monitoring session"""
        if self.is_running:
            print("Session already running")
            return
        
        self.intervention_type = parameters.get('interventionType', 'none')
        self.sound_volume = parameters.get('soundVolume', 50)
        self.session_data['taskContext'] = parameters.get('taskContext', 'Unknown')
        self.session_data['startTime'] = time.time()
        self.state_machine.start_session(self.session_data['startTime'])
        self.session_phase = SessionState.BASELINE.value
        self.last_action = np.zeros(5, dtype=np.float32)
        self.last_audio_command = np.zeros(5, dtype=np.float32)
        self.training_samples = []
        
        # Reset session data
        for key in ['attentionScores', 'alphaPowers', 'betaPowers', 'thetaPowers', 'deltaPowers', 'timestamps']:
            self.session_data[key] = []
        
        self.is_running = True
        self.is_sound_active = (self.intervention_type != 'none')

        if self.is_sound_active:
            self.sound_engine.start()
        
        # Start EEG streaming thread
        eeg_thread = threading.Thread(target=self.stream_eeg_loop)
        eeg_thread.daemon = True
        eeg_thread.start()
        
        print(f"✓ Session started - Intervention: {self.intervention_type}")
    
    def stop_session(self):
        """Stop EEG monitoring and save session"""
        if not self.is_running:
            print("No active session")
            return
        
        self.is_running = False
        self.is_sound_active = False
        self.state_machine.end_session()
        self.session_phase = SessionState.ENDED.value
        self.session_data['endTime'] = time.time()
        self.last_audio_command = np.zeros(5, dtype=np.float32)

        self.sound_engine.update_params(np.zeros(5, dtype=np.float32))
        self.sound_engine.stop()
        
        # Calculate session summary
        time.sleep(1)  # Wait for last data points
        
        if len(self.session_data['attentionScores']) > 0:
            summary = {
                'userId': self.user_id,
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.localtime(self.session_data['startTime'])),
                'attentionScore': round(np.mean(self.session_data['attentionScores']), 2),
                'interventionType': self.intervention_type,
                'taskContext': self.session_data['taskContext'],
                'sessionDuration': int((self.session_data['endTime'] - self.session_data['startTime']) / 60),
                'baselineScore': round(float(self.state_machine.baseline_focus) if self.state_machine.baseline_focus > 0 else np.mean(self.session_data['attentionScores'][:10]) if len(self.session_data['attentionScores']) >= 10 else 0, 2),
                'peakScore': round(max(self.session_data['attentionScores']), 2),
                'averageScore': round(np.mean(self.session_data['attentionScores']), 2),
                'stressLevel': 'moderate',  # You can calculate this based on data
                'environmentalFactors': {
                    'noiseLevel': 'moderate',
                    'lighting': 'normal',
                    'temperature': 'comfortable'
                },
                'notes': f"Automated session - {len(self.session_data['attentionScores'])} data points collected"
            }
            
            # Save to MongoDB via API
            self.save_session_to_db(summary)

            if self.enable_online_training:
                trained, msg = self.rl_agent.train_on_session(
                    self.training_samples,
                    save_path=self.model_save_path,
                    total_timesteps=self.training_steps,
                )
                status = '✓' if trained else '⚠️'
                print(f"{status} Online model update: {msg}")
            
            # Notify React clients via WebSocket
            if self.ws and self.ws.sock and self.ws.sock.connected:
                self.ws.send(json.dumps({
                    'type': 'SESSION_COMPLETE',
                    'userId': self.user_id,
                    'sessionData': summary
                }))
            
            print("✓ Session stopped and saved")
    
    def save_session_to_db(self, session_data):
        """Save session data to MongoDB via REST API"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': self.api_key
            }
            
            # Add userId to session data
            session_payload = {
                'userId': self.user_id,
                **session_data
            }
            
            response = requests.post(
                f'{self.api_url}/sessions/python',
                json=session_payload,
                headers=headers
            )
            
            if response.status_code == 201:
                print("✓ Session saved to database")
                return True
            else:
                print(f"Failed to save session: {response.status_code}")
                print(response.text)
                return False
                
        except Exception as e:
            print(f"Error saving session: {e}")
            return False
    
    def handle_sound_control(self, data):
        """Handle sound control commands from React"""
        action = data.get('action')
        
        if action == 'start':
            self.is_sound_active = True
            self.sound_engine.start()
            print("Sound activated")
        elif action == 'stop':
            self.is_sound_active = False
            self.sound_engine.update_params(np.zeros(5, dtype=np.float32))
            self.sound_engine.stop()
            print("Sound deactivated")
        elif action == 'volume':
            self.sound_volume = data.get('parameters', {}).get('volume', 50)
            print(f"Volume set to {self.sound_volume}%")
    
    def run(self):
        """Main run method"""
        print("="*50)
        print("EEG Neurofeedback Pipeline Starting...")
        print(f"User ID: {self.user_id}")
        print(f"WebSocket URL: {self.ws_url}")
        print("="*50)
        
        self.connect_websocket()
        
        print("\n✓ Ready! Waiting for session start command from React...")
        print("Press Ctrl+C to exit\n")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")
            self.stop_session()
            if self.ws:
                self.ws.close()


if __name__ == '__main__':
    print("="*50)
    print("Starting EEG Neuropipeline Host...")
    print("="*50)

    # Configuration
    API_KEY = os.getenv('PYTHON_API_KEY', 'your_python_api_key_change_this')
    WS_URL = os.getenv('NEUROTUNE_WS_URL', 'ws://localhost:5000/eeg-stream')
    API_URL = os.getenv('NEUROTUNE_API_URL', 'http://localhost:5000/api')
    
    # Dynamically fetch user ID via HTTP Polling
    print("\nWaiting for a user to log in on the React frontend dashboard...")
    USER_ID = None
    while not USER_ID:
        try:
            response = requests.get(f"{API_URL}/auth/active-local-user")
            if response.status_code == 200 and response.json().get('userId'):
                USER_ID = response.json().get('userId')
                break
        except Exception:
            pass
        time.sleep(2)
        
    print(f"\n✓ User {USER_ID} logged in automatically! Booting pipeline parameters...\n")
    
    # Create and run pipeline
    pipeline = EEGNeurofeedbackPipeline(
        user_id=USER_ID,
        api_key=API_KEY,
        ws_url=WS_URL,
        api_url=API_URL
    )
    
    pipeline.run()
