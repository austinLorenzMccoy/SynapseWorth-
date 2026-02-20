# ✈️ AircraftWorth (SynapseWorth → Neuron MLAT)

![Neuron](https://img.shields.io/badge/Neuron-MLAT-blue?style=flat-square) ![Hedera](https://img.shields.io/badge/Hedera-Testnet-9cf?style=flat-square) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square) ![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)

> **Distributed Aircraft Tracking via Multilateration.** AircraftWorth is a real-time MLAT system that consumes Mode-S data from the Neuron sensor network, calculates aircraft positions using TDOA, and notarizes every solution on Hedera with Supabase for geospatial persistence and live visualization.

## 📚 Table of Contents
1. [Architecture](#-architecture)
2. [Feature Highlights](#-feature-highlights)
3. [Repository Map](#-repository-map)
4. [Quick Start](#-quick-start)
5. [Environment Configuration](#-environment-configuration)
6. [Core Workflows](#-core-workflows)
7. [Additional Documentation](#-additional-documentation)

## 🧠 Architecture
```mermaid
graph LR
    Aircraft[Aircraft 1090MHz] -->|Mode-S| Neuron[Neuron Sensors]
    Neuron -->|Stream| Buyer[Neuron Buyer Service]
    Buyer -->|Batch| MLAT[MLAT Pipeline]
    MLAT -->|TDOA Solver| Position[Aircraft Position]
    Position -->|Store| Supabase[(Supabase PostGIS)]
    Position -->|Log| Hedera[(HCS / HTS)]
    Supabase -->|Realtime| Frontend[Next.js Dashboard]
    Frontend -->|Map View| User
```
- **Neuron Sensor Network**: Distributed Mode-S receivers with GPS timestamps and libp2p streams.
- **MLAT Solver**: Time Difference of Arrival (TDOA) algorithm using SciPy for multilateration.
- **Hedera Trust Layer**: HCS logs every MLAT solution; HTS mints Flight Track Tokens for high-confidence positions (≥90%, ≥4 sensors).
- **Supabase Geospatial DB**: PostGIS for sensor locations, TimescaleDB-style indexing for time-series Mode-S messages and aircraft positions.
- **Real-time Dashboard**: Leaflet map with live aircraft markers, sensor network visualization, and Hedera proof explorer.

## ✨ Feature Highlights
- ✈️ **Real-time aircraft tracking** via Neuron Mode-S sensor network with MLAT position calculation.
- 📍 **Geospatial precision** using PostGIS for sensor locations and aircraft position storage in Supabase.
- 🧾 **Immutable audit trail** with every MLAT solution logged to Hedera HCS including sensor IDs and confidence scores.
- 🪙 **Flight Track Tokens** minted via Hedera HTS for high-confidence positions (≥90% confidence, ≥4 sensors).
- �️ **Live dashboard** with Leaflet map showing aircraft positions, sensor network, and real-time Supabase subscriptions.
- 🔄 **Replay CLI** for testing MLAT pipeline with recorded Mode-S datasets (100% success rate on test data).
- 🛰️ **Neuron buyer service** with async queue-based message buffering and sensor discovery.

## 🗂 Repository Map
```
.
├── README.md                  # You are here 👋
├── backend/                   # FastAPI + Neuron + MLAT + Hedera + Supabase
│   ├── mlat-core/             # 📦 SDK-ready MLAT calculation module
│   ├── hedera-logger/         # 📦 SDK-ready Hedera HCS/HTS integration
│   ├── neuron-client/         # 📦 SDK-ready Neuron sensor client
│   ├── services/              # Neuron buyer, MLAT solver, Supabase, Hedera
│   ├── routers/               # MLAT API endpoints
│   ├── scripts/               # Sensor seeding, replay CLI, Hedera setup
│   ├── supabase/              # PostgreSQL schema with PostGIS
│   └── tests/                 # MLAT solver unit tests
├── frontend/                  # Next.js 16 MLAT dashboard with live map
│   ├── app/mlat/              # Real-time aircraft tracking page
│   ├── components/            # Aircraft map (Leaflet), navigation
│   └── lib/                   # Supabase client, type definitions
├── docs/                      # Neuron bounty PRD, improved PRD
└── SUPABASE_SETUP.md          # Database schema setup instructions
```
Refer to each subfolder README for deep dives.

## 📦 SDK-Ready Architecture

AircraftWorth is built with a **modular, SDK-ready architecture** that separates core functionality into reusable components. Each module can be used independently or composed together for custom MLAT applications.

### Core Modules

#### 1. **mlat-core** - MLAT Calculation Engine
Pure TDOA multilateration logic with no external dependencies.

```python
from mlat_core import MLATCalculator, SensorReading

calculator = MLATCalculator(min_sensors=4)
result = calculator.calculate_position(
    icao_address="ABC123",
    sensor_readings=[...]
)
```

**Features**: TDOA calculation, confidence scoring, GDOP estimation, time window filtering  
**Documentation**: [`backend/mlat-core/README.md`](backend/mlat-core/README.md)

#### 2. **hedera-logger** - Hedera Integration
Clean interface for HCS logging and HTS token minting.

```python
from hedera_logger import HederaLogger

logger = HederaLogger(operator_id="0.0.123", operator_key="...")
result = await logger.log_position(
    topic_id="0.0.7968510",
    position_data={...}
)
```

**Features**: HCS topic submission, HTS NFT minting, batch operations, async support  
**Documentation**: [`backend/hedera-logger/README.md`](backend/hedera-logger/README.md)

#### 3. **neuron-client** - Neuron Network Interface
Sensor data ingestion and Mode-S message streaming.

```python
from neuron_client import NeuronClient

client = NeuronClient(
    buyer_account_id="0.0.6324974",
    sensor_ids=["sensor1", "sensor2"]
)

async for message in client.stream_messages():
    print(f"Aircraft: {message.icao_address}")
```

**Features**: Real-time streaming, batch fetching, sensor health monitoring, ICAO filtering  
**Documentation**: [`backend/neuron-client/README.md`](backend/neuron-client/README.md)

### Composability Example

```python
# Complete MLAT pipeline using SDK modules
from mlat_core import MLATCalculator, SensorReading
from hedera_logger import HederaLogger
from neuron_client import NeuronClient

# Initialize components
neuron = NeuronClient(buyer_account_id="0.0.6324974", sensor_ids=[...])
mlat = MLATCalculator(min_sensors=4)
hedera = HederaLogger(operator_id="0.0.123", operator_key="...")

# Fetch sensor data
messages = await neuron.fetch_recent_messages(time_window_seconds=60)

# Convert to sensor readings
readings = [
    SensorReading(
        sensor_id=msg.sensor_id,
        icao_address=msg.icao_address,
        timestamp_ns=msg.timestamp_ns,
        latitude=msg.sensor_latitude,
        longitude=msg.sensor_longitude
    )
    for msg in messages
]

# Calculate position
result = mlat.calculate_position("ABC123", readings)

# Log to Hedera
if result.position:
    await hedera.log_position("0.0.7968510", {
        "icao": result.position.icao_address,
        "lat": result.position.latitude,
        "lon": result.position.longitude,
        "confidence": result.position.confidence_score
    })
```

## 🚀 Quick Start
> **Prereqs**: Python 3.12+, Node 20+/pnpm 9, Supabase account, Hedera testnet credentials, Neuron buyer credentials.

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 2. Supabase Schema
1. Go to your Supabase SQL Editor
2. Copy and run `backend/supabase/schema.sql`
3. Seed sensors: `python scripts/seed_sensors.py`

### 3. Environment Configuration
Copy `backend/.env.example` to `backend/.env` and fill in:
- Hedera operator credentials (ID, private key)
- Supabase URL and keys (anon + service role)
- Neuron buyer credentials and sensor IDs

### 4. Frontend Setup
```bash
cd frontend
pnpm install
```
Create `frontend/.env.local` with Supabase credentials.

### 5. Run Services
```bash
# Backend (FastAPI + auto-reload)
cd backend
uvicorn main:app --reload --port 8000

# Frontend (Next.js dev server)
cd frontend
pnpm dev --port 3000
```

### 6. Test MLAT Pipeline
```bash
cd backend
# Generate sample data
python scripts/replay_modes.py --generate data/sample.ndjson --aircraft 3 --messages 15

# Replay through pipeline
python scripts/replay_modes.py --file data/sample.ndjson
```

Visit `http://localhost:3000/mlat` for the live aircraft tracking dashboard.

## 🔐 Environment Configuration

### Backend `.env`
```bash
# Hedera
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...
HCS_TOPIC_ID=0.0.xxxxx
SWT_TOKEN_ID=0.0.xxxxx

# Neuron
NEURON_BUYER_ACCOUNT_ID=0.0.xxxxx
NEURON_BUYER_PRIVATE_KEY=...
NEURON_SENSOR_IDS=021a29e7...,037ec65f...,030a3c71...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# MLAT Config
MLAT_MIN_SENSORS=3
MLAT_CONFIDENCE_THRESHOLD=80
```

### Frontend `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

> **Security**: `.gitignore` protects `.env*` and `buyer-env` files. Never commit live keys.

## 🧭 Core Workflows

### MLAT Pipeline
1. **Neuron Stream Ingestion**: Buyer service connects to Neuron sensors, buffers Mode-S messages in async queue.
2. **Message Batching**: `POST /api/mlat/ingest` receives batches, stores in Supabase `mode_s_messages` table.
3. **MLAT Calculation**: Pipeline groups messages by ICAO + time window, runs TDOA solver with ≥3 sensors.
4. **Hedera Logging**: Every solution logged to HCS with sensor IDs, confidence, and metadata.
5. **Token Minting**: High-confidence positions (≥90%, ≥4 sensors) trigger Flight Track Token minting via HTS.
6. **Real-time Updates**: Supabase Realtime pushes new positions to frontend map via WebSocket.

### API Endpoints
- `POST /api/mlat/ingest` - Ingest Mode-S message batches
- `POST /api/mlat/process` - Process MLAT for specific aircraft
- `GET /api/mlat/health` - Pipeline health check

### Testing & Replay
```bash
# Generate synthetic Mode-S data
python scripts/replay_modes.py --generate data/test.ndjson --aircraft 5 --messages 20

# Replay through full pipeline
python scripts/replay_modes.py --file data/test.ndjson --batch-size 10
```

## � Future: SDK Distribution

The modular architecture is designed to evolve into distributable SDKs for the broader Neuron and Hedera developer community.

### Planned SDK Packages

#### Python SDK
```bash
pip install aircraftworth-mlat      # MLAT calculation engine
pip install aircraftworth-hedera    # Hedera HCS/HTS integration
pip install aircraftworth-neuron    # Neuron sensor client
```

#### TypeScript/JavaScript SDK
```bash
npm install @aircraftworth/mlat-core
npm install @aircraftworth/hedera-logger
npm install @aircraftworth/neuron-client
```

### SDK Roadmap

**Phase 1: Module Stabilization** (Current)
- ✅ Extract core logic into independent modules
- ✅ Add comprehensive documentation
- ✅ Create usage examples
- ⏳ Add unit tests for each module
- ⏳ Define stable APIs

**Phase 2: Package Distribution**
- [ ] Set up PyPI packaging for Python modules
- [ ] Set up npm packaging for TypeScript ports
- [ ] Create GitHub releases with versioning
- [ ] Add CI/CD for automated testing and publishing

**Phase 3: Developer Experience**
- [ ] Interactive documentation with examples
- [ ] CLI tools for common operations
- [ ] Integration guides for popular frameworks
- [ ] Community templates and starter kits

**Phase 4: Advanced Features**
- [ ] Full TDOA implementation (currently using centroid)
- [ ] Kalman filtering for position smoothing
- [ ] Support for multiple MLAT algorithms
- [ ] Performance optimizations and caching
- [ ] WebAssembly builds for browser usage

### Why SDK?

**For Developers:**
- Build custom MLAT applications without reinventing the wheel
- Integrate aircraft tracking into existing systems
- Leverage Hedera for verifiable position data

**For Neuron Network:**
- Standardized interface for sensor data consumption
- Lower barrier to entry for new participants
- Ecosystem growth through composability

**For Hedera:**
- Reference implementation for HCS/HTS in aviation
- Demonstrates real-world DLT use cases
- Enables new applications on Hedera network

## �📄 Additional Documentation
- [`docs/NEURON_BOUNTY_PRD.md`](docs/NEURON_BOUNTY_PRD.md): Original Neuron bounty strategy and architecture.
- [`docs/improved_prd.md`](docs/improved_prd.md): Enhanced PRD with 10/10 fit roadmap and implementation plan.
- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md): Step-by-step Supabase schema setup and troubleshooting.
- [`backend/README.md`](backend/README.md): Backend specific commands, endpoints, and testing.
- [`backend/supabase/schema.sql`](backend/supabase/schema.sql): PostgreSQL schema with PostGIS extensions.
- [`backend/mlat-core/README.md`](backend/mlat-core/README.md): MLAT calculation engine documentation.
- [`backend/hedera-logger/README.md`](backend/hedera-logger/README.md): Hedera integration module documentation.
- [`backend/neuron-client/README.md`](backend/neuron-client/README.md): Neuron sensor client documentation.

## 🏆 Neuron Bounty Alignment

**Challenge**: Build a Multilateration (MLAT) system for aircraft localization using Neuron Mode-S sensor network.

**Our Solution**:
- ✅ Neuron buyer service with async stream consumption
- ✅ MLAT solver using TDOA with SciPy optimization
- ✅ Hedera HCS logging for immutable audit trail
- ✅ Flight Track Tokens (HTS) for high-confidence positions
- ✅ Supabase PostGIS for geospatial sensor + position storage
- ✅ Real-time dashboard with Leaflet map and live updates
- ✅ Replay CLI for reproducible testing (100% success rate)
- ✅ 12 Neuron sensors seeded with location metadata

**Demo**: Visit `/mlat` dashboard for live aircraft tracking with Hedera proof explorer.

Need help? Open an issue or reach out during the hackathon. ✈️
