# 🛡️ ClauseGuard — AI-Powered Legal Contract Auditor

ClauseGuard is a production-grade AI legal technology platform that audits rental agreements and contracts against Indian tenancy law (Model Tenancy Act 2021) using a Retrieval-Augmented Generation (RAG) pipeline.

## 🏗️ Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌────────────────────┐
│   Frontend      │────▶│   Backend API     │────▶│   RAG Engine       │
│   (React/Vite)  │     │   (FastAPI)       │     │   (FastAPI)        │
│   Port: 5173    │     │   Port: 8000      │     │   Port: 8001       │
└─────────────────┘     └───────────────────┘     └────────────────────┘
                              │                          │
                              ▼                          ▼
                        ┌──────────┐              ┌───────────────┐
                        │  SQLite  │              │   ChromaDB    │
                        │  (.db)   │              │  (Vector DB)  │
                        └──────────┘              └───────────────┘
```

## ✨ Features

- **AI Contract Audit** — Upload a PDF and get clause-by-clause risk analysis
- **Legal RAG** — Answers grounded in actual Indian tenancy law
- **Interactive Lawyer** — Chat with your contract using AI
- **Negotiation AI** — Get fair alternative clauses for risky terms
- **Dispute Triage** — AI-mediated landlord-tenant dispute resolution
- **PDF Export** — Download professional audit reports
- **Google OAuth** — Secure authentication

## 🚀 Quick Start

### Prerequisites

- Python 3.11+ 
- Node.js 18+
- npm

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd clauseguard
```

### 2. Install Dependencies

```bash
# Frontend
cd ClauseGuard-frontend && npm install && cd ..

# Backend
cd ClauseGuard-backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..

# RAG Engine
cd ClauseGuard-rag && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..
```

### 3. Configure Environment

Copy `.env.example` to `.env` in each service directory and fill in your values:

```bash
cp ClauseGuard-backend/.env.example ClauseGuard-backend/.env
cp ClauseGuard-rag/.env.example ClauseGuard-rag/.env
cp ClauseGuard-frontend/.env.example ClauseGuard-frontend/.env
```

**Required keys:**
- `GEMINI_API_KEY` — Get from [Google AI Studio](https://aistudio.google.com/apikey)
- `GOOGLE_CLIENT_ID` — Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### 4. Start Development

```bash
# Option 1: All services at once
./start-dev.sh

# Option 2: Individual services
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:8000
npm run dev:rag        # http://localhost:8001
```

### 5. Ingest Legal Documents

Before first use, ingest the legal PDF corpus:

```bash
curl -X POST http://localhost:8001/api/ingest
```

## 🐳 Docker Deployment

```bash
# Set your API keys
export GEMINI_API_KEY=your_key
export GOOGLE_CLIENT_ID=your_client_id

# Build and start
docker compose up --build
```

## 📁 Project Structure

```
clauseguard/
├── ClauseGuard-frontend/     # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── context/          # Auth context
│   │   ├── services/         # API clients
│   │   └── layouts/          # Layout components
│   └── .env
├── ClauseGuard-backend/      # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── routes/           # API endpoints
│   │   ├── models/           # SQLAlchemy models
│   │   └── schemas/          # Pydantic schemas
│   └── .env
├── ClauseGuard-rag/          # FastAPI + ChromaDB + Gemini
│   ├── legal_engine/
│   │   ├── api.py            # REST endpoints
│   │   ├── retriever.py      # Vector search
│   │   ├── generator.py      # LLM generation
│   │   ├── clause_auditor.py # Audit pipeline
│   │   ├── chunker.py        # PDF chunking
│   │   └── config.py         # Configuration
│   └── .env
├── docker-compose.yml
├── start-dev.sh
└── package.json              # Monorepo scripts
```

## 🔧 API Endpoints

### Backend (Port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agreements/upload/{tenant_id}` | Upload PDF for audit |
| GET | `/agreements/{id}` | Get agreement + audit results |
| POST | `/agreements/{id}/re-audit` | Re-trigger AI audit |
| POST | `/users/google-login` | Google OAuth login |
| GET | `/health` | Backend health check |

### RAG Engine (Port 8001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit` | Audit contract clauses |
| POST | `/api/chat` | Chat with a document |
| POST | `/api/rephrase` | Suggest fair clause alternatives |
| POST | `/api/query` | Ask a legal question |
| POST | `/api/search` | Semantic search over law DB |
| POST | `/api/dispute` | Dispute triage |
| GET | `/api/health` | RAG engine health check |

## 🔐 Security

- Google OAuth 2.0 authentication
- Environment-based secret management
- File type and size validation on uploads
- Configurable CORS origins
- No API keys exposed to frontend

## 📊 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| Backend | FastAPI, SQLAlchemy, SQLite |
| RAG Engine | FastAPI, ChromaDB, Sentence-Transformers |
| AI Model | Google Gemini 1.5 Flash 8B |
| Embeddings | all-MiniLM-L6-v2 (384-dim) |
| Auth | Google OAuth 2.0 |

## 📝 License

MIT License
