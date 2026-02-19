# 🧠 SynapseWorth Backend

![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-Llama3-blueviolet?style=for-the-badge)
![Hedera](https://img.shields.io/badge/Hedera-Testnet-111?style=for-the-badge)
![Coverage](https://img.shields.io/badge/Coverage-100%25_target-orange?style=for-the-badge)

> **Mission:** Serve Groq-powered evaluations and Hedera trust primitives that make every AI decision auditable, replayable, and tokenizable.

## 📦 Tech Stack
- **Framework:** FastAPI + Uvicorn
- **AI:** Groq SDK (Llama3 + deterministic fallbacks)
- **Ledger:** Hedera SDK (HCS logging + HTS minting) with graceful stubs when creds are absent
- **Validation:** Pydantic v2 models
- **Testing:** Pytest + pytest-asyncio + coverage gate (100%)

## 🗺️ Service Map
```
routers/
├── agent.py        # /api/agent/evaluate -> GroqService + Evaluation Store
├── evaluation.py   # /api/evaluation/{userId} -> demo-friendly history feed
└── hedera.py       # /api/hedera/log-evaluation + /mint-skill-token

services/
├── groq_service.py       # AI cognition layer (LLM calls + fallback logic)
├── hedera_service.py     # Hedera client wrapper (HCS/HTS + stubs)
└── evaluation_store.py   # In-memory persistence + seeded demo data
```

## ⚙️ Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
cp .env.example .env        # fill in keys when available
```

### `.env` Variables
| Key | Description |
|-----|-------------|
| `GROQ_API_KEY` | Groq API key. If omitted, service auto-falls back to deterministic responses. |
| `GROQ_MODEL` | Defaults to `llama3-8b-8192`. |
| `HEDERA_OPERATOR_ID / KEY` | Required for live Hedera calls; otherwise stub mode is enabled. |
| `HCS_TOPIC_ID` | Topic to log evaluations. Optional for demo. |
| `SWT_TOKEN_ID` | Token to mint Skill Worth Tokens. Optional for demo. |
| `PORT` | FastAPI port (default `8000`). |

> 🔐 **Never commit `.env`.** The repo already ignores these files.

## 🚀 Running the API
```bash
uvicorn main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/` ➜ `{ "message": "SynapseWorth Backend API" }`

## 📡 Key Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/agent/evaluate` | Accepts `EvaluationRequest` (profile + optional userId) and returns Groq-evaluated skills, confidence, and career trajectory. Results are persisted to the in-memory store. |
| `GET`  | `/api/evaluation/{userId}` | Returns latest evaluations + computed reputation. Falls back to seeded `agent-demo` data when user is new. |
| `POST` | `/api/hedera/log-evaluation` | Logs evaluation metadata to Hedera HCS (or local stub). |
| `POST` | `/api/hedera/mint-skill-token` | Mints SWT tokens via HTS (or returns stub token IDs). |

## 🧪 Testing
```bash
pytest
# or with coverage reports (default in pyproject):
pytest --cov --cov-report=term-missing
```
- Tests mock Groq/Hedera clients where needed.
- Coverage gate is set to 100%; until real credentials are injected you can rely on stubbed fallbacks.

> ⏳ **Waiting on credentials?** You can skip live tests for now; once keys are available re-run `pytest` to validate Hedera/Groq integrations end-to-end.

## 🛰️ Demo Data & Persistence
- `services/evaluation_store.py` seeds user **`agent-demo`** with believable insight history.
- Every evaluation request stores the response (max 25 per user) so dashboards stay lively.

## 🔄 Deployment Notes
- Works with `uvicorn` or any ASGI server.
- Ensure environment variables are injected via your platform’s secret manager.
- Hedera/Groq clients initialize lazily and log meaningful warnings if credentials are missing.

## 🆘 Troubleshooting
| Symptom | Fix |
|---------|-----|
| `groq.GroqError: api_key must be set` | Populate `GROQ_API_KEY` or rely on fallback by leaving it empty (log warning). |
| `Client.for_testnet missing` | Some SDK builds expose `forTestnet`; wrapper already attempts both. Make sure `hedera-sdk-py` version matches `pyproject`. |
| Coverage gate fails | Run `pytest -k <test>` to address failing cases; add mocks for Groq/Hedera interactions. |

Happy hacking! 🧩
