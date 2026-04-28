# EEG Neurofeedback System

A real-time neurofeedback platform for attention monitoring and enhancement using EEG brain signals. The system features live brain wave visualization, automated attention score calculation, and therapeutic sound intervention. Built with React, Node.js, WebSockets, MongoDB, and Python.

## 🚀 Features

### Real-Time EEG Monitoring
- **Live Brain Wave Visualization**: Real-time display of Alpha, Beta, Theta, Delta, Gamma waves
- **Attention Score Gauge**: Dynamic 0-100 attention score with color-coded feedback
- **Timeline Chart**: 60-second sliding window of attention history
- **Session Statistics**: Average, peak, and current attention metrics

### Neurofeedback Interventions
- **Auditory Feedback**: Binaural beats adjusted to attention levels
- **Visual Feedback**: Color-coded alerts and progress indicators (coming soon)
- **Haptic Feedback**: Wearable device vibration patterns (coming soon)
- **Adaptive Sound**: Volume and frequency automatically adjusted to brain state

### WebSocket Architecture
- **Dual Client Support**: Python EEG pipeline + React dashboard
- **Low-Latency Streaming**: <200ms data transmission
- **Bidirectional Communication**: React controls → Python execution
- **Automatic Reconnection**: Network resilience with exponential backoff

### Data Management
- **Session Logging**: Automatic save to MongoDB when session ends
- **Manual Entry Fallback**: Traditional form-based logging still available
- **Session History**: Browse and analyze past sessions
- **JWT Authentication**: Secure user accounts with bcrypt password hashing

### Tide Controller (attention game)
- **Full-screen coastal neurofeedback game** driven by a dedicated WebSocket attention score (`ws://localhost:8080` by default), with **demo mode** when no server is available.
- **Documentation:** [docs/TIDE_CONTROLLER.md](docs/TIDE_CONTROLLER.md) — demo vs production, protocol, artifacts, saving sessions, troubleshooting.

# STEW Dataset

This folder should contain the raw EEG `.txt` files from the
STEW (Simultaneous Task EEG Workload) Dataset.

## Download

Download from IEEE DataPort:
https://ieee-dataport.org/open-access/stew-simultaneous-task-eeg-workload-dataset

Or from Kaggle:
https://www.kaggle.com/datasets/mitulahirwal/mental-cognitive-workload-eeg-data-stew-dataset

## File Naming Convention

After downloading, place the files here:

    stew_data/
    ├── sub01_lo.txt   ← Subject 1, resting state
    ├── sub01_hi.txt   ← Subject 1, multitasking task
    ├── sub02_lo.txt
    ├── sub02_hi.txt
    ├── ...
    └── sub48_hi.txt

## Format

- 14 columns (EEG channels): AF3, F7, F3, FC5, T7, P7, O1, O2, P8, T8, FC6, F4, F8, AF4
- 128 Hz sampling rate
- ~19,200 rows per file (2.5 minutes)
- No header row — raw numbers only

## Citation

Lim, W.L., Sourina, O., Wang, L.P. (2018).
STEW: Simultaneous Task EEG Workload Dataset.
IEEE Transactions on Neural Systems and Rehabilitation Engineering, 26(5).
DOI: 10.1109/TNSRE.2018.2803577

## 📋 Tech Stack

### Frontend
- React 18 (Real-time UI components)
- Vite (Build tool)
- Tailwind CSS (Responsive styling)
- Recharts (Data visualization)
- WebSocket Client (Real-time communication)
- JWT Authentication

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- WebSocket Server (`ws` library)
- JWT (JSON Web Tokens)
- Bcrypt (Password hashing)
- CORS + API key authentication for Python

### Python EEG Pipeline
- WebSocket Client (`websocket-client`)
- NumPy + SciPy (Signal processing)
- SoundDevice (Audio generation)
- EEG device SDK (Muse, OpenBCI, etc.)

## 🛠️ Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone or Navigate to Project

```powershell
cd "c:\Users\lenovo\OneDrive\Desktop\Major Project"
```

### Step 2: Install Dependencies

Install all dependencies for both frontend and backend:

```powershell
npm run install-all
```

Or install manually:

```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 3: Configure Environment Variables

#### Backend Configuration

Create `.env` file in the `backend` folder:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend\.env` with your values:

```env
MONGODB_URI=mongodb://localhost:27017/attention-monitoring
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
PYTHON_API_KEY=your_python_api_key_change_this
```

**Important**: 
- Replace `JWT_SECRET` with a strong random string:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Replace `PYTHON_API_KEY` with a secure key (Python pipeline will use this to authenticate)

**For MongoDB Atlas** (cloud database):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attention-monitoring
```

#### Frontend Configuration

Create `.env` file in the `frontend` folder:

```powershell
cd frontend
Copy-Item .env.example .env
```

Edit `frontend\.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/eeg-stream
```

#### Python Pipeline Configuration

1. Install Python dependencies:
   ```powershell
   cd python_eeg_pipeline
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Edit `python_eeg_pipeline/eeg_neurofeedback.py`:
   - Set `USER_ID` to your account's user ID (get from browser after login)
   - Set `API_KEY` to match `PYTHON_API_KEY` from backend `.env`
   - Update `read_eeg_data()` method with your EEG device code

### Step 4: Start MongoDB (Local Installation)

If using local MongoDB:

```powershell
# Start MongoDB service
net start MongoDB
```

If MongoDB is not installed as a service, run:

```powershell
mongod --dbpath "C:\data\db"
```

**Skip this step if using MongoDB Atlas**

### Step 5: Run the Application

#### Step 5a: Start Backend + Frontend

**Terminal 1 - Backend & WebSocket Server:**
```powershell
cd backend
npm run dev
```
Backend will start on `http://localhost:5000` and WebSocket on `ws://localhost:5000/eeg-stream`

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```
Frontend will start on `http://localhost:5173`

#### Step 5b: Start Python EEG Pipeline (For Real-Time Monitoring)

**Terminal 3 - Python Pipeline:**
```powershell
cd python_eeg_pipeline
venv\Scripts\activate
python eeg_neurofeedback.py
```

The Python pipeline will:
1. Connect to WebSocket server
2. Wait for session start command from React dashboard
3. Begin streaming EEG data when session starts
4. Generate therapeutic sound based on attention scores
5. Save session to MongoDB when stopped

### Step 6: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/health
- **WebSocket Stats**: http://localhost:5000/api/ws/stats

## 🧠 How It Works

### Real-Time Data Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  EEG Headset    │────────>│  Python Pipeline │────────>│  WebSocket      │
│  (Muse/OpenBCI) │         │                  │         │  Server         │
└─────────────────┘         │  - Read signals  │         │  (Node.js)      │
                            │  - Calculate     │<────────│                 │
                            │    attention     │         │  - Route data   │
                            │  - Generate      │         │  - Broadcast    │
                            │    sound         │         └────────┬────────┘
                            └──────────────────┘                  │
                                                                  v
                                                         ┌─────────────────┐
                                                         │  React Dashboard│
                                                         │                 │
                                                         │  - Live gauges  │
                                                         │  - Wave bars    │
                                                         │  - Timeline     │
                                                         │  - Controls     │
                                                         └─────────────────┘
```

### WebSocket Message Protocol

#### From React → WebSocket Server:
```json
{
  "type": "AUTH",
  "token": "jwt_token_here"
}

{
  "type": "SESSION_CONTROL",
  "action": "start",
  "parameters": {
    "interventionType": "auditory",
    "soundVolume": 75,
    "taskContext": "Reading task"
  }
}

{
  "type": "SOUND_CONTROL",
  "action": "volume",
  "parameters": { "volume": 50 }
}
```

#### From Python → WebSocket Server:
```json
{
  "type": "PYTHON_REGISTER",
  "apiKey": "your_python_api_key",
  "userId": "user_id_here"
}

{
  "type": "EEG_DATA",
  "userId": "user_id",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "attentionScore": 78.5,
  "alpha": 12.3,
  "beta": 15.7,
  "theta": 8.2,
  "delta": 4.1,
  "gamma": 2.5,
  "isSoundActive": true,
  "interventionType": "auditory"
}

{
  "type": "SESSION_COMPLETE",
  "userId": "user_id",
  "sessionData": { /* full session summary */ }
}
```

#### From WebSocket → React/Python:
```json
{
  "type": "REGISTER_SUCCESS",
  "userId": "user_id"
}

{
  "type": "SESSION_CONTROL",
  "action": "start",
  "parameters": { /* session config */ }
}

{
  "type": "EEG_DATA",
  /* ... brain wave data ... */
}
```

### Attention Score Calculation

Formula used in Python pipeline:
```
Attention Score = [(Beta + Alpha) / (Theta + Delta)] × 10
```
Normalized to 0-100 scale:
- **0-50**: Low attention → 20 Hz binaural beat (Beta - alertness)
- **50-75**: Moderate → 10 Hz beat (Alpha - focus)
- **75-100**: High → 6 Hz beat (Theta - deep concentration)

## 📁 Project Structure

```
Major Project/
├── backend/                    # Backend Node.js API + WebSocket
│   ├── middleware/            # Authentication middleware
│   │   └── auth.js           # JWT verification
│   ├── models/                # MongoDB models
│   │   ├── Session.js        # Session schema
│   │   └── User.js           # User schema with bcrypt
│   ├── routes/                # REST API routes
│   │   ├── auth.js           # Login, register, password management
│   │   └── sessions.js       # Session CRUD operations
│   ├── websocket/             # WebSocket server
│   │   └── websocketServer.js # EEG data streaming & routing
│   ├── .env.example           # Environment template
│   ├── package.json
│   └── server.js              # Express + WebSocket entry point
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AuthView.jsx           # Login/Register
│   │   │   ├── Dashboard.jsx          # Main dashboard with live/manual toggle
│   │   │   ├── DashboardLayout.jsx    # Layout wrapper
│   │   │   ├── LiveEEGMonitor.jsx     # Real-time gauge, waves, timeline
│   │   │   ├── SessionControls.jsx    # Start/stop, intervention settings
│   │   │   ├── LatestSessionDetails.jsx
│   │   │   ├── LoggingForm.jsx        # Manual entry fallback
│   │   │   ├── Profile.jsx
│   │   │   ├── ScoreTrendChart.jsx
│   │   │   └── SessionHistory.jsx
│   │   ├── services/          # Services
│   │   │   ├── authService.js        # JWT token management
│   │   │   └── websocketService.js   # WebSocket client with reconnection
│   │   ├── App.jsx            # Main app with WebSocket connection
│   │   ├── index.css          # Global styles
│   │   └── main.jsx           # React entry point
│   ├── .env.example           # Environment template
│   ├── package.json
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── vite.config.js         # Vite configuration
│
├── python_eeg_pipeline/        # Python EEG processing
│   ├── eeg_neurofeedback.py   # Main pipeline script
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Python setup guide
│
├── .gitignore
├── package.json               # Root package.json with scripts
└── README.md                  # This file
```

## 🔑 API Endpoints

### REST API

All endpoints (except health check and auth endpoints) require JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (no auth) |
| POST | `/api/auth/register` | Register new user (no auth) |
| POST | `/api/auth/login` | Login user (no auth) |
| GET | `/api/auth/me` | Get current user info |
| PUT | `/api/auth/update-password` | Update password |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/sessions` | Get all sessions for user |
| GET | `/api/sessions/:id` | Get single session |
| POST | `/api/sessions` | Create new session |
| PUT | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Delete session |
| GET | `/api/sessions/stats/summary` | Get user statistics |
| GET | `/api/ws/stats` | Get WebSocket connection stats |

### WebSocket API

**Endpoint**: `ws://localhost:5000/eeg-stream`

#### Client Types:
1. **React Clients**: Authenticate with JWT token
2. **Python Clients**: Authenticate with API key

See "How It Works" section above for full message protocol documentation.
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123'
  })
});
const data = await response.json();
const token = data.data.token; // Save this token
```

#### Create Session
```javascript
const response = await fetch('http://localhost:5000/api/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    timestamp: new Date().toISOString(),
    attentionScore: 85.5,
    interventionType: 'visual',
    taskContext: 'Reading',
    sessionDuration: 30,
    baselineScore: 70,
    peakScore: 92,
    averageScore: 82,
    stressLevel: 'low',
    environmentalFactors: {
      noiseLevel: 'quiet',
      lighting: 'normal',
      temperature: 'comfortable'
    },
    notes: 'Focused session with good concentration'
  })
});
```

## 📊 Data Schema

### Session Model

```javascript
{
  userId: String,              // User ID reference
  timestamp: Date,             // Session timestamp
  attentionScore: Number,      // 0-100
  interventionType: String,    // 'none', 'visual', 'auditory', 'haptic', 'multi-modal'
  taskContext: String,         // Description of task
  sessionDuration: Number,     // Duration in minutes
  baselineScore: Number,       // Optional: 0-100
  peakScore: Number,           // Optional: 0-100
  averageScore: Number,        // Optional: 0-100
  stressLevel: String,         // 'low', 'moderate', 'high'
  environmentalFactors: {
    noiseLevel: String,        // 'quiet', 'moderate', 'loud'
    lighting: String,          // 'dim', 'normal', 'bright'
    temperature: String        // 'cold', 'comfortable', 'warm'
  },
  notes: String,               // Optional: Max 1000 characters
  eegData: Object              // Optional: Raw EEG data
}
```

### User Model

```javascript
{
  email: String,               // Unique email (required)
  password: String,            // Bcrypt hashed (required)
  name: String,                // Display name (optional)
  createdAt: Date,             // Auto-generated
  updatedAt: Date              // Auto-generated
}
```

## 🎨 Component Architecture

### React Components

**Real-Time Components:**
- **LiveEEGMonitor.jsx** - Gauge, wave bars, timeline chart (updates every 200ms)
- **SessionControls.jsx** - Start/stop controls, intervention settings
- **websocketService.js** - WebSocket client with event emitter pattern

**Traditional Components:**
- **Dashboard.jsx** - Main view with live/manual mode toggle
- **LoggingForm.jsx** - Manual session entry (fallback mode)
- **ScoreTrendChart.jsx** - Historical trend visualization
- **SessionHistory.jsx** - Filterable session table
- **Profile.jsx** - User settings

**Layout Components:**
- **App.jsx** - Root with authentication + WebSocket connection
- **AuthView.jsx** - Login/Register interface
- **DashboardLayout.jsx** - Main layout with navigation

### Python Pipeline Classes

**EEGNeurofeedbackPipeline:**
- `connect_websocket()` - Establish connection with auth
- `read_eeg_data()` - Interface with EEG device (override this!)
- `compute_band_powers()` - FFT-based frequency analysis
- `calculate_attention_score()` - (Beta+Alpha)/(Theta+Delta) formula
- `generate_binaural_beat()` - Therapeutic sound generation
- `stream_eeg_loop()` - Main 5Hz data streaming loop
- `handle_sound_control()` - React command processor

## 🔧 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongooseServerSelectionError`

**Solution:**
- Ensure MongoDB is running: `net start MongoDB`
- Check connection string in `backend\.env`
- For Atlas, verify IP whitelist in MongoDB Atlas dashboard

### JWT Token Issues

**Error:** `Invalid or expired token`

**Solution:**
- Ensure JWT_SECRET is set in `backend\.env`
- Token expires after 7 days by default (configurable with JWT_EXPIRE)

### WebSocket Connection Failed

**Error:** `WebSocket connection to 'ws://localhost:5000/eeg-stream' failed`

**Solutions:**
- Ensure backend server is running
- Check `VITE_WS_URL` in `frontend/.env`
- Verify firewall isn't blocking port 5000
- Check browser console for authentication errors

### Python Pipeline Not Connecting

**Error:** `Python client registration failed`

**Solutions:**
- Verify `PYTHON_API_KEY` matches in both `backend/.env` and Python script
- Check `USER_ID` is correct (get from browser after login)
- Ensure backend WebSocket server is running
- Run `pip install -r requirements.txt` to install dependencies

### No Sound Output from Python

**Error:** No audio playing during session

**Solutions:**
- Test audio device: `python -m sounddevice`
- Check intervention type is set to 'auditory'
- Verify `is_sound_active` flag in EEG_DATA messages
- Ensure sound volume > 0

### EEG Device Not Found

**Error:** Device connection error

**Solutions:**
- Install device-specific drivers (Muse, OpenBCI SDK)
- Replace `read_eeg_data()` placeholder with actual device code
- Check USB/Bluetooth connection
- Run device manufacturer's test utility first

## 🧪 Testing the System

### 1. Test Backend Only
```powershell
cd backend
npm run dev
```
Visit `http://localhost:5000/api/health` - should return `{"status":"ok"}`

### 2. Test WebSocket Server
```powershell
# In browser console after logging in:
const ws = new WebSocket('ws://localhost:5000/eeg-stream');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'AUTH',
    token: 'your_jwt_token_here'
  }));
};
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

### 3. Test Python Pipeline (Simulated Data)
```powershell
cd python_eeg_pipeline
venv\Scripts\activate
python eeg_neurofeedback.py
```
The script uses simulated EEG data by default - no real headset needed for testing.

### 4. Full Integration Test
1. Start backend (`cd backend; npm run dev`)
2. Start frontend (`cd frontend; npm run dev`)
3. Login to React app at `http://localhost:5173`
4. Start Python pipeline (Terminal 3)
5. Click "Live Monitoring" mode in dashboard
6. Click "Start Session" with intervention type "Auditory"
7. Watch live data stream in gauges and charts
8. Python will generate binaural beats based on simulated attention scores
9. Click "Stop Session" to save to MongoDB

## 🚀 Production Deployment

### Build Frontend

```powershell
cd frontend
npm run build
```

The production-ready files will be in `frontend/dist/`

### Environment Variables for Production

**Backend:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attention-monitoring
PORT=5000
JWT_SECRET=<strong_random_string>
JWT_EXPIRE=7d
CORS_ORIGIN=https://yourdomain.com
PYTHON_API_KEY=<strong_random_string>
NODE_ENV=production
```

**Frontend:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com/eeg-stream
```

### Deployment Platforms

- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, DigitalOcean, AWS
- **Database**: MongoDB Atlas (recommended)
- **Python Pipeline**: Run on local machine with EEG device or cloud VM if using remote headset

**Note:** WebSocket requires secure connection (WSS) in production with valid SSL certificate.

## 📝 Usage Guide

### Getting Started

1. **Create Account**: Register with email and password
2. **Login**: Access your dashboard
3. **Get User ID**: Open browser console and run:
   ```javascript
   localStorage.getItem('userId')
   ```
4. **Configure Python**: Add your user ID to `python_eeg_pipeline/eeg_neurofeedback.py`

### Live Monitoring Mode

1. **Start Python Pipeline**: Run `python eeg_neurofeedback.py` in Terminal 3
2. **Toggle to Live Mode**: Click "Live Monitoring" tab in dashboard
3. **Configure Session**:
   - Enter task context (e.g., "Reading", "Studying")
   - Select intervention type (Auditory/Visual/Haptic/None)
   - Adjust sound volume (0-100%)
4. **Start Session**: Click "Start Session" button
5. **Watch Real-Time Data**:
   - Attention score gauge updates every 200ms
   - Wave bars show Alpha, Beta, Theta, Delta, Gamma levels
   - Timeline chart displays last 60 seconds
   - Python generates therapeutic sound automatically
6. **Stop Session**: Click "Stop Session" to save to database

### Manual Entry Mode (Fallback)

1. **Toggle to Manual**: Click "Manual Entry" tab
2. **Fill Form**: Enter session data manually
3. **Submit**: Click "Log Session" to save
4. **View History**: See all sessions in Session History tab

### Viewing Analytics

- **Dashboard Stats**: Total sessions, averages, peak scores
- **Trend Chart**: Visual score progression over time
- **Session History**: Filter by type, task, date range
- **Latest Session**: Quick view of most recent data

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style

- Frontend: ESLint + Prettier (React best practices)
- Backend: Standard JavaScript conventions
- Python: PEP 8 style guide

## 🔐 Security Notes

- **Never commit `.env` files** to version control
- **Use strong JWT_SECRET** (64+ character random string)
- **Change PYTHON_API_KEY** from default value
- **Enable MongoDB authentication** in production
- **Use HTTPS/WSS** in production deployments
- **Hash passwords** with bcrypt (already implemented)
- **Validate all inputs** on both client and server

## 📄 License

This project is for educational purposes. Modify and distribute as needed.
- **Sort by**: Date (newest/oldest), score (highest/lowest)
- **View**: Comprehensive table with all session details

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use a strong, random JWT_SECRET in production
- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 7 days (configurable)
- In production, use HTTPS for all API communications
- Implement rate limiting on API endpoints for production use
- Consider implementing refresh tokens for long-lived sessions

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [JWT Documentation](https://jwt.io/introduction)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/)
- [Bcrypt Documentation](https://www.npmjs.com/package/bcryptjs)

## 🤝 Future Enhancements

- Real-time EEG data integration via WebSockets
- Advanced analytics and reporting
- Export data to CSV/PDF
- Multi-user collaboration features
- Mobile application (React Native)
- Machine learning-based predictions
- Intervention effectiveness analysis

## 📄 License

This project is for educational purposes.

---

**Need Help?** Check the troubleshooting section or review the Firebase and MongoDB documentation for common issues.
