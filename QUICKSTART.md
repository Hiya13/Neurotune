# Quick Start Guide - EEG Neurofeedback System

This guide will help you get the system running in **5 minutes**.

## Prerequisites

- Node.js (v16+) installed
- Python 3.8+ installed
- MongoDB running locally or Atlas account

## Step 1: Install Dependencies (2 minutes)

```powershell
# From project root
cd "c:\Users\tshub\OneDrive\Desktop\Neurotune"

# Install Node.js dependencies
npm install
cd backend
npm install
cd ..\frontend
npm install
cd ..\python_eeg_pipeline

# Create Python virtual environment
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Step 2: Configure Environment (1 minute)

### Backend
```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend\.env`:
- Set `JWT_SECRET` to a random string
- Set `PYTHON_API_KEY` to a random string (e.g., "mysecretkey123")
- Keep other defaults

### Frontend
```powershell
cd ..\frontend
Copy-Item .env.example .env
```
(No changes needed - defaults are fine)

## Step 3: Start MongoDB (30 seconds)

```powershell
net start MongoDB
```

Or if not installed as service:
```powershell
mongod --dbpath "C:\data\db"
```

## Step 4: Run the System (1 minute)

### Option A: One command (recommended)

```powershell
# From project root
npm run dev:full
```

This starts backend + frontend + Python pipeline together.

### Option B: 3 terminals (manual)

### Terminal 1 - Backend
```powershell
cd backend
npm run dev
```
Wait for: `✓ Server running on port 5000`

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### Terminal 3 - Python Pipeline
```powershell
cd python_eeg_pipeline
.\venv\Scripts\Activate.ps1
$env:NEUROTUNE_USER_ID = "paste_your_user_id_here"
$env:PYTHON_API_KEY = "mysecretkey123"  # Must match backend .env
python eeg_neurofeedback.py
```

To get your user id quickly:
1. Open browser at `http://localhost:5173`
2. Login
3. Open browser console (F12)
4. Run `localStorage.getItem('userId')`
5. Paste into `NEUROTUNE_USER_ID`

Wait for: `✓ Ready! Waiting for session start command`

## Step 5: Test Real-Time Monitoring (30 seconds)

1. In browser at `http://localhost:5173`:
   - Click **"Live Monitoring"** tab
   - Enter task: "Testing"
   - Select intervention: **"Auditory"**
   - Volume: **75%**
   - Click **"Start Session"**

2. Watch the magic happen:
   - Attention gauge moves in real-time
   - Wave bars update every 200ms
   - Timeline chart scrolls
   - **Python plays binaural beats** (check your speakers!)

3. After 30 seconds, click **"Stop Session"**
   - Session auto-saves to MongoDB
   - View in "Session History" tab

## Troubleshooting

### "WebSocket connection failed"
- Ensure backend is running (Terminal 1)
- Check `http://localhost:5000/api/health` in browser

### "Python client registration failed"
- Verify `$env:PYTHON_API_KEY` matches `PYTHON_API_KEY` in `backend\.env`
- Ensure `$env:NEUROTUNE_USER_ID` is correct

### "MongoDB connection error"
- Start MongoDB: `net start MongoDB`
- Or use Atlas connection string

### "No sound playing"
- Check speakers/headphones
- Verify intervention type is "Auditory"
- Test: `python -m sounddevice` to list audio devices

## What's Happening?

```
EEG Headset (simulated) → Python reads signals every 200ms
                              ↓
                    Calculates attention score (0-100)
                              ↓
                    Generates binaural beats (therapeutic sound)
                              ↓
                    Sends to WebSocket server
                              ↓
                    React receives and displays live data
```

## Next Steps

1. **Replace simulated EEG data** with real device:
   - Edit `read_eeg_data()` in `eeg_neurofeedback.py`
   - See examples for Muse, OpenBCI in `python_eeg_pipeline/README.md`

2. **Customize attention formula**:
   - Edit `calculate_attention_score()` method
   - Adjust thresholds in `generate_binaural_beat()`

3. **Add visual/haptic feedback**:
   - Modify Python to send device commands
   - Update React components for visual cues

## Done! 🎉

You now have a working real-time neurofeedback system. The default configuration uses **simulated EEG data** - perfect for testing without hardware.

For detailed documentation, see the main `README.md`.
