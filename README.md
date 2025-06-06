# MedAssist - Complete Telemedicine Platform

🏥 **Modern telemedicine platform with multi-role authentication, real-time chat, prescription management, and pharmacy integration.**

## 🚀 Quick Deploy to Railway + Vercel

### Backend (Railway)
1. Fork this repository
2. Create account at [railway.app](https://railway.app)
3. Create new project → Deploy from GitHub
4. Select your forked repository
5. Add these environment variables in Railway:

```bash
MONGO_URL=mongodb+srv://Bennynav:12345@cluster0.icdspma.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=medassist_db
PORT=8001
HOST=0.0.0.0
JWT_SECRET=medassist_secret_key_2025_production_railway
ALGORITHM=HS256
```

### Frontend (Vercel)
1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set build command: `cd frontend && npm run build`
4. Set output directory: `frontend/build`
5. Add environment variable:
```bash
REACT_APP_BACKEND_URL=https://your-railway-app-url.up.railway.app
```

## 🏗️ Project Structure

```
medassist-platform/
├── backend/               # FastAPI Backend
│   ├── server.py         # Main API server
│   ├── requirements.txt  # Python dependencies
│   ├── Procfile         # Railway deployment
│   ├── railway.json     # Railway configuration
│   ├── runtime.txt      # Python version
│   └── .env.example     # Environment variables template
├── frontend/             # React Frontend
│   ├── src/
│   │   ├── App.js       # Main React application
│   │   ├── App.css      # Enhanced styling
│   │   └── index.js     # Entry point
│   ├── public/
│   │   └── index.html   # HTML template
│   ├── package.json     # Node dependencies
│   └── .env.example     # Frontend environment template
└── README.md            # This file
```

## 🔧 Local Development

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MongoDB connection
uvicorn server:app --reload --port 8001
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend URL
npm start
```

## 🌟 Features

- **🔐 Multi-Role Authentication**: Patient, Doctor, Pharmacy portals
- **💬 Real-Time Chat**: WebSocket-based messaging between patients and doctors
- **💊 Digital Prescriptions**: Complete prescription management workflow
- **🏥 Pharmacy Integration**: Prescription dispensing and tracking
- **📱 Responsive Design**: Works on all devices
- **🎨 Modern UI/UX**: Beautiful, professional healthcare design

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Axios
- **Backend**: FastAPI, MongoDB, WebSockets, JWT
- **Database**: MongoDB Atlas
- **Deployment**: Railway (Backend) + Vercel (Frontend)

## 📦 Environment Variables

### Backend (.env)
```bash
MONGO_URL=your-mongodb-connection-string
DB_NAME=medassist_db
JWT_SECRET=your-secret-key
PORT=8001
HOST=0.0.0.0
```

### Frontend (.env)
```bash
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

## 🚀 Production Deployment

The platform is configured for zero-config deployment:
- **Railway**: Automatically detects Python and uses `Procfile`
- **Vercel**: Automatically detects React and builds
- **MongoDB Atlas**: Cloud database with connection string

## 📄 License

MIT License - Feel free to use for your projects!

---

**Built with ❤️ for modern healthcare**