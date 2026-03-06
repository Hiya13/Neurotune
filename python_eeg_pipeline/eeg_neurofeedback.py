# Python EEG Pipeline Requirements
# Install these packages:
# pip install websocket-client numpy scipy sounddevice requests

import json
import time
import threading
import websocket
import numpy as np
import sounddevice as sd
from scipy import signal
import requests

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
            idx = np.logical_and(freqs >= low, freqs <= high)
            band_powers[band] = np.trapz(psd[idx], freqs[idx])
        
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
    
    def generate_binaural_beat(self, attention_score):
        """
        Generate therapeutic sound based on attention score.
        Lower attention = more stimulating frequency
        Higher attention = calming frequency
        """
        if not self.is_sound_active:
            return
        
        # Base frequency (carrier)
        base_freq = 200  # Hz
        
        # Binaural beat frequency (difference between ears)
        # Low attention: higher beat frequency (more alert - beta range)
        # High attention: lower beat frequency (maintain focus - alpha range)
        if attention_score < 50:
            beat_freq = 20  # Beta (alertness)
        elif attention_score < 75:
            beat_freq = 10  # Alpha (focused relaxation)
        else:
            beat_freq = 6   # Theta (deep focus)
        
        # Generate stereo signal
        duration = 0.2  # 200ms
        t = np.linspace(0, duration, int(self.sample_rate * duration))
        
        # Left ear
        left = np.sin(2 * np.pi * base_freq * t)
        # Right ear (with binaural difference)
        right = np.sin(2 * np.pi * (base_freq + beat_freq) * t)
        
        # Combine stereo and apply volume
        volume = self.sound_volume / 100.0
        stereo_signal = np.column_stack((left, right)) * volume * 0.3
        
        # Play sound
        sd.play(stereo_signal, self.sample_rate, blocking=False)
    
    def stream_eeg_loop(self):
        """Main loop for reading EEG and streaming data"""
        print("Starting EEG streaming loop...")
        
        while self.is_running:
            try:
                # Read EEG data
                eeg_data, fs = self.read_eeg_data()
                
                # Compute band powers
                band_powers = self.compute_band_powers(eeg_data, fs)
                
                # Calculate attention score
                attention_score = self.calculate_attention_score(band_powers)
                
                # Store for session summary
                self.session_data['attentionScores'].append(attention_score)
                self.session_data['alphaPowers'].append(band_powers['alpha'])
                self.session_data['betaPowers'].append(band_powers['beta'])
                self.session_data['thetaPowers'].append(band_powers['theta'])
                self.session_data['deltaPowers'].append(band_powers['delta'])
                self.session_data['timestamps'].append(time.time())
                
                # Generate therapeutic sound
                if self.intervention_type == 'auditory':
                    self.generate_binaural_beat(attention_score)
                
                # Send data to React via WebSocket
                if self.ws and self.ws.sock and self.ws.sock.connected:
                    payload = {
                        'type': 'EEG_DATA',
                        'userId': self.user_id,
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                        'attentionScore': round(attention_score, 2),
                        'alpha': round(band_powers['alpha'], 2),
                        'beta': round(band_powers['beta'], 2),
                        'theta': round(band_powers['theta'], 2),
                        'delta': round(band_powers['delta'], 2),
                        'gamma': round(band_powers.get('gamma', 0), 2),
                        'isSoundActive': self.is_sound_active,
                        'interventionType': self.intervention_type
                    }
                    
                    self.ws.send(json.dumps(payload))
                
                # Sleep for update interval (e.g., 200ms = 5 Hz update rate)
                time.sleep(0.2)
                
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
        
        # Reset session data
        for key in ['attentionScores', 'alphaPowers', 'betaPowers', 'thetaPowers', 'deltaPowers', 'timestamps']:
            self.session_data[key] = []
        
        self.is_running = True
        self.is_sound_active = (self.intervention_type != 'none')
        
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
        self.session_data['endTime'] = time.time()
        
        sd.stop()  # Stop any playing sound
        
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
                'baselineScore': round(np.mean(self.session_data['attentionScores'][:10]) if len(self.session_data['attentionScores']) >= 10 else 0, 2),
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
            print("Sound activated")
        elif action == 'stop':
            self.is_sound_active = False
            sd.stop()
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
    # Configuration
    USER_ID = "6994a0088e0efc10b3190b96"  # Get this from your user account
    API_KEY = "your_python_api_key_change_this"  # Same as in backend .env
    WS_URL = "ws://localhost:5000/eeg-stream"
    API_URL = "http://localhost:5000/api"
    
    # Create and run pipeline
    pipeline = EEGNeurofeedbackPipeline(
        user_id=USER_ID,
        api_key=API_KEY,
        ws_url=WS_URL,
        api_url=API_URL
    )
    
    pipeline.run()
