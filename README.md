# InvestIQ - AI-Powered Investment Research Assistant

A modern, full-stack investment research platform that combines real-time market data with AI-powered analysis to help you make informed investment decisions.

![InvestIQ Dashboard](https://img.shields.io/badge/React-18-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.0-cyan)

## Features

- **Real-time Stock Data** - Live quotes, price history, and key metrics from Finnhub
- **AI Investment Briefs** - Comprehensive AI-generated analysis including bull/bear cases, risks, and catalysts
- **Technical Analysis** - Moving averages, RSI, MACD, support/resistance levels
- **Financial Metrics** - Valuation ratios, profitability, liquidity, and growth metrics
- **Earnings Data** - Quarterly/annual earnings with estimates and growth projections
- **News with AI Summaries** - Latest news articles with AI-powered summarization and sentiment
- **User Authentication** - Google OAuth login for personalized experience
- **Personal Watchlists** - Track your favorite stocks with user-specific storage
- **Dark Mode** - Full dark mode support with smooth transitions
- **Export Options** - Download data as PDF or CSV

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Async ORM with PostgreSQL (SQLite for local dev)
- **Finnhub API** - Real-time stock market data (free tier: 60 calls/minute)
- **Groq AI** - Llama 3.3 70B via Groq for fast AI analysis
- **Pydantic** - Data validation and settings
- **Google OAuth** - User authentication

### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **TanStack Query** - Data fetching and caching
- **Recharts** - Beautiful charts
- **Lucide React** - Modern icons

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Finnhub API key from [Finnhub](https://finnhub.io/) (free)
- Groq API key from [Groq Console](https://console.groq.com/) (free)
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/) (for authentication)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys:
#   FINNHUB_API_KEY=your_finnhub_key
#   GROQ_API_KEY=your_groq_key
#   GOOGLE_CLIENT_ID=your_google_client_id
#   GOOGLE_CLIENT_SECRET=your_google_client_secret

# Run the server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Environment Variables

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `FINNHUB_API_KEY` | Finnhub API key for stock data | Yes |
| `GROQ_API_KEY` | Groq API key for AI analysis | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes (for auth) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes (for auth) |
| `DATABASE_URL` | Database connection string | No (defaults to SQLite) |
| `JWT_SECRET` | Secret key for JWT tokens | Yes (in production) |
| `FRONTEND_URL` | Frontend URL for OAuth redirects | No (defaults to localhost) |

## Project Structure

```
investments-assistant/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── services/        # Business logic
│   │   │   ├── finnhub_client.py  # Finnhub API client
│   │   │   ├── stock_service.py   # Stock quotes
│   │   │   ├── news_service.py    # News aggregation
│   │   │   ├── technical_service.py # Technical analysis
│   │   │   └── financial_service.py # Financial data
│   │   ├── models/          # Database models
│   │   └── config.py        # Settings
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── contexts/        # Auth context
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   └── package.json
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/stock/{ticker}/quote` | Get stock quote |
| `GET /api/v1/technical/{ticker}/history` | Get price history |
| `GET /api/v1/technical/{ticker}/indicators` | Get technical indicators |
| `GET /api/v1/technical/{ticker}/analyst` | Get analyst ratings |
| `GET /api/v1/financial/{ticker}/earnings` | Get earnings data |
| `GET /api/v1/financial/{ticker}/ratios` | Get financial ratios |
| `POST /api/v1/brief` | Generate AI brief |
| `GET /api/v1/brief/{ticker}` | Get cached brief |
| `GET /api/v1/news/{ticker}/summary` | Get news with AI summary |
| `GET /api/v1/watchlist` | Get user's watchlist |
| `POST /api/v1/watchlist` | Add to watchlist |
| `GET /api/v1/auth/login` | Initiate Google OAuth |
| `GET /api/v1/auth/callback` | OAuth callback |
| `GET /api/v1/auth/me` | Get current user |

## Deployment

### Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│  Vercel         │  HTTPS  │  Render         │
│  (Frontend)     │◄───────►│  (Backend)      │
│                 │         │                 │
│  React + Vite   │         │  FastAPI        │
│  Static Assets  │         │  SQLite DB      │
│                 │         │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
             ┌──────────┐     ┌──────────┐     ┌──────────┐
             │ Finnhub  │     │  Groq    │     │  Google  │
             │   API    │     │   AI     │     │  OAuth   │
             └──────────┘     └──────────┘     └──────────┘
```

### Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project" → Import your GitHub repository
   - Select the `frontend` folder as the root directory

2. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   | Variable | Value | Description |
   |----------|-------|-------------|
   | `VITE_API_URL` | `https://your-backend.onrender.com` | Backend API URL |

4. **Deploy** - Vercel auto-deploys on every push to `main`

### Backend Deployment (Render)

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `investiq-api` (or your choice)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**
   | Variable | Description |
   |----------|-------------|
   | `FINNHUB_API_KEY` | Your Finnhub API key |
   | `GROQ_API_KEY` | Your Groq API key |
   | `GOOGLE_CLIENT_ID` | Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
   | `JWT_SECRET` | Random string for JWT signing (use `openssl rand -hex 32`) |
   | `FRONTEND_URL` | Your Vercel frontend URL (e.g., `https://investiq.vercel.app`) |
   | `DATABASE_URL` | Optional - defaults to SQLite file |

4. **Persistent Storage** (for SQLite)
   - Add a Render Disk at `/opt/render/project/src/backend/data`
   - Set `DATABASE_URL=sqlite+aiosqlite:///./data/investiq.db`

### Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Create "OAuth 2.0 Client ID" (Web application)
5. Add **Authorized JavaScript origins**:
   - `https://your-app.vercel.app`
   - `http://localhost:5173` (for local dev)
6. Add **Authorized redirect URIs**:
   - `https://your-backend.onrender.com/api/v1/auth/callback`
   - `http://localhost:8000/api/v1/auth/callback` (for local dev)

### Post-Deployment Checklist

- [ ] Frontend can reach backend API (check browser console)
- [ ] Google OAuth login works (redirect URIs configured correctly)
- [ ] Stock data loads (Finnhub API key valid)
- [ ] AI briefs generate (Groq API key valid)
- [ ] Watchlist persists (database connected)
- [ ] Dark mode works across all pages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Disclaimer

This tool is for educational and research purposes only. It does not constitute financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions.
