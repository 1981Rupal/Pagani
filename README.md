# Pagani AI Atelier — integration starter

A standalone customization module intended to plug into an existing vehicle website.
It does **not** replace the host website.

## Included
- FastAPI backend and REST API
- Vehicle-specific option catalogue and compatibility validation
- Exterior/interior theme library
- AI consultation and three design proposals
- Ollama-compatible LLM adapter with deterministic fallback
- Shared configuration model for AI and manual editing
- Optional React/Three.js integration adapter
- In-memory storage for local MVP testing

## Important asset and accuracy note
The included `pagani_utopia` catalogue is **demo data**, not an official Pagani factory option list.
Replace it with manufacturer-authorized specifications before presenting configurations as buildable.
The 3D viewer requires a properly licensed GLB/GLTF model with named meshes/material slots.
No Pagani 3D model or proprietary asset is included.

## Run backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Optional local AI:
1. Install/start Ollama.
2. Pull a model, for example `ollama pull llama3.1:8b`.
3. Set `AI_PROVIDER=ollama` and `OLLAMA_MODEL=llama3.1:8b` in `.env`.
4. The backend sends the model a strict JSON-output prompt. If Ollama is unavailable, deterministic demo parsing is used.

## Main API flow

1. `GET /api/v1/vehicles`
2. `GET /api/v1/vehicles/pagani_utopia/options`
3. `GET /api/v1/themes?vehicle_id=pagani_utopia`
4. `POST /api/v1/ai/consult` — normalize questionnaire and free-text brief
5. `POST /api/v1/ai/generate` — return three validated design configurations
6. `PATCH /api/v1/configurations/{configuration_id}` — manually change one or more fields
7. `GET /api/v1/configurations/{configuration_id}` — retrieve current configuration

## Frontend integration

See `frontend-optional/README.md`. The host frontend can:
- call the REST API directly, or
- copy/use the optional React component and Three.js adapter.

The 3D adapter expects a GLB/GLTF asset whose mesh names match a mapping you define in
`vehicleAssetMap.ts`. If the asset does not expose separate material slots, it must be
prepared in Blender or another 3D tool first.

## Production work still required
- Replace in-memory repository with PostgreSQL
- Add authentication, ownership checks, rate limiting and audit logs
- Use manufacturer-authorized vehicle specs and licensed 3D assets
- Add server-side persistent design versions
- Add image/render queue for high-quality output
- Add engineering approval workflow for non-cosmetic changes
- Configure CORS for the actual website domain
