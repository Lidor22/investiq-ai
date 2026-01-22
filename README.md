# InvestIQ - AI-Powered Investment Research Assistant

A modern, full-stack investment research platform that combines real-time market data with AI-powered analysis to help you make informed investment decisions.

![InvestIQ Dashboard](https://img.shields.io/badge/React-18-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.0-cyan)

## Features

- **Real-time Stock Data** - Live quotes, price history, and key metrics from Yahoo Finance
- **AI Investment Briefs** - Comprehensive AI-generated analysis including bull/bear cases, risks, and catalysts
- **Technical Analysis** - Moving averages, RSI, MACD, support/resistance levels
- **Financial Metrics** - Valuation ratios, profitability, liquidity, and growth metrics
- **Earnings Data** - Quarterly/annual earnings with estimates and growth projections
- **News with AI Summaries** - Latest news articles with AI-powered summarization and sentiment
- **Watchlist** - Track your favorite stocks with persistent storage
- **Dark Mode** - Full dark mode support with smooth transitions
- **Export Options** - Download data as PDF or CSV

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Async ORM with SQLite
- **yfinance** - Yahoo Finance market data
- **Groq AI** - Llama 3.3 70B via Groq for fast AI analysis
- **Pydantic** - Data validation and settings

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
- Groq API key from [Groq Console](https://console.groq.com/) (free)

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
# Edit .env and add your GROQ_API_KEY

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

## Project Structure

```
investments-assistant/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   └── schemas/         # Pydantic schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   └── package.json
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/stocks/{ticker}` | Get stock quote |
| `GET /api/v1/stocks/{ticker}/history` | Get price history |
| `GET /api/v1/technical/{ticker}/indicators` | Get technical indicators |
| `GET /api/v1/technical/{ticker}/analyst` | Get analyst ratings |
| `GET /api/v1/financial/{ticker}/earnings` | Get earnings data |
| `GET /api/v1/financial/{ticker}/ratios` | Get financial ratios |
| `POST /api/v1/brief` | Generate AI brief |
| `GET /api/v1/brief/{ticker}` | Get cached brief |
| `GET /api/v1/news/{ticker}/summary` | Get news with AI summary |
| `GET /api/v1/watchlist` | Get watchlist |
| `POST /api/v1/watchlist` | Add to watchlist |

## Screenshots

### Light Mode
The clean, modern interface with real-time data and AI insights.

### Dark Mode
Full dark mode support for comfortable viewing in any environment.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Disclaimer

This tool is for educational and research purposes only. It does not constitute financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions.
