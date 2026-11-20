# Pagani AI Atelier — Integration Module

A standalone AI-powered luxury car customization module intended to plug into an existing vehicle website.
It does **not** replace the host website.

## Included
- FastAPI backend and REST API
- Cloud-native MongoDB Atlas asynchronous persistence (`AsyncMongoClient`)
- 7 managed collections with automated indexes & revision history
- Vehicle-specific option catalogue and compatibility validation
- Exterior/interior theme library
- AI consultation and three design proposals
- Ollama-compatible LLM adapter with deterministic fallback
- Shared configuration model for AI and manual editing
- Next.js 16 / React 19 / Three.js 3D studio integration
- Dual-mode repository: MongoDB Atlas cloud persistence with automated local fallback

## Important Asset and Accuracy Note
The included `pagani_utopia` catalogue is **demo data**, not an official Pagani factory option list.
Replace it with manufacturer-authorized specifications before presenting configurations as buildable.
The 3D viewer requires a properly licensed GLB/GLTF model with named meshes/material slots.
No Pagani 3D model or proprietary asset is included.

---

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Cloud Database: MongoDB Atlas Setup

This project uses **MongoDB Atlas** as its cloud database via PyMongo's asynchronous client (`AsyncMongoClient`). No local MongoDB server or Docker container is required.

### 1. Create a MongoDB Atlas Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (e.g. M0 tier on AWS/GCP).
3. Under **Security > Database Access**, create a database user (e.g., `atelier_user`) with read/write privileges.
4. Under **Security > Network Access**, add your IP address (or `0.0.0.0/0` with secure credentials for development).

### 2. Configure Environment Variables
In `backend/.env`:
```env
# Replace with your Atlas connection string from Atlas > Connect > Drivers > Python
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-address>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=pagani_atelier
```

### 3. Managed Collections & Automated Indexing
When the backend starts up with a valid `MONGODB_URI`, the FastAPI lifespan initializes the connection and ensures indexes on all 7 collections:
- `users`: User profiles with unique index on `email`.
- `vehicles`: Vehicle specifications with unique index on `id`.
- `vehicle_options`: Catalogue options with compound index on `(vehicle_id, option_path)`.
- `design_configurations`: User & AI configurations with indexes on `id`, `vehicle_id`, and `updated_at`.
- `ai_proposals`: Generated AI proposals linked to originating briefs.
- `design_versions`: Immutable snapshot revision history with compound index on `(configuration_id, version_number)`.
- `design_themes`: Exterior and interior curated theme libraries.

*Note:* If `MONGODB_URI` is not set or unreachable, the application gracefully operates in local fallback mode so development and automated tests continue to run seamlessly. Check `GET /health` to inspect live database status.

---

## AI Engine Configuration (GroqCloud / Fallback)

1. **GroqCloud API (Default):**
   - High-throughput, low-latency AI inference using GroqCloud with the official `groq` Python SDK (`AsyncGroq`).
   - Default model: `openai/gpt-oss-120b`.
   - In `backend/.env`:
     ```env
     AI_PROVIDER=groq
     GROQ_API_KEY=gsk_your_groq_api_key_here
     GROQ_MODEL=openai/gpt-oss-120b
     GROQ_TIMEOUT_SECONDS=90
     GROQ_MAX_RETRIES=3
     ```
   - Features:
     - Strict catalogue validation: unsupported or hallucinated options are automatically sanitized and logged as warnings.
     - Structured JSON response parsing with Markdown fence stripping.
     - Exponential backoff retry logic for rate limits (429) and network timeouts.
     - Safe error handling: never exposes `GROQ_API_KEY` to frontend or logs.
     - Transparent fallback to mock engine if the API key is not yet configured or if external services are unavailable.

2. **Mock Provider (Development & Testing Fallback):**
   - Runs completely offline with deterministic luxury styling rules.
   - Used automatically when `AI_PROVIDER=mock` or when Groq credentials are omitted.

3. **Legacy Ollama Integration (Optional):**
   - Set `AI_PROVIDER=ollama` and `OLLAMA_BASE_URL=http://localhost:11434`. Ollama is no longer required or run by default.

---

## Main API Flow

1. `GET /health` — health & database connectivity status
2. `GET /api/v1/vehicles` — list available vehicle profiles
3. `GET /api/v1/vehicles/pagani_utopia/options` — retrieve catalogue options
4. `GET /api/v1/themes?vehicle_id=pagani_utopia` — curated exterior & interior themes
5. `POST /api/v1/ai/consult` — normalize questionnaire and free-text brief
6. `POST /api/v1/ai/generate` — generate 3 distinct validated proposals
7. `GET /api/v1/configurations/{configuration_id}` — fetch configuration document
8. `GET /api/v1/configurations/{configuration_id}/versions` — fetch revision history
9. `PATCH /api/v1/configurations/{configuration_id}` — apply partial component modifications (creates a new design version snapshot)

---

## Frontend Integration

The Next.js 16 frontend is located in `frontend/`:
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000) for the 3D studio and atelier customization experience.
