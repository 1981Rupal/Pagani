# Pagani Atelier — concept study

A private, invite-style digital experience for a Pagani buyer: from the first sketch to the owner's chapter.

> Concept study for a student project. Not affiliated with Pagani Automobili S.p.A. Imagery is placeholder. Model facts are as published by Pagani.

**Design system:** read [`DESIGN.md`](./DESIGN.md) before writing any UI.
**Prototype (all screens):** https://claude.ai/artifact/UgwZCnWG72s2H4tnGnWyVr

---

## Stack

| Layer | Choice | Lives in |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript | `frontend/` |
| Styling | Tailwind CSS v4, themed with the Arte e Scienza tokens | `frontend/app/globals.css` |
| Motion | Framer Motion | `frontend/` |
| Backend | FastAPI (Python ≥ 3.10) | `backend/` |
| Database | MongoDB Atlas (PyMongo async / Motor) | `backend/` |
| Identity | No login: a guest ID cookie and a private build link (`/b/[buildId]`) | both |
| AI | Grok (xAI) for *Ask the car* · Gemini for vision renders | `backend/` only |
| Deploy | Frontend on Vercel · backend on Render | — |

> ⚠️ Next.js 16 has breaking changes. Read `frontend/AGENTS.md` and the docs in `frontend/node_modules/next/dist/docs/` before writing Next-specific code.

---

## Quick start

### Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
fastapi dev app.py     # http://localhost:8000  ·  docs at /docs
```

### Environment
`backend/.env`
```bash
MONGODB_URI=
XAI_API_KEY=
GEMINI_API_KEY=
ADVISOR_EMAIL=          # where reservation requests are sent
FRONTEND_ORIGIN=http://localhost:3000
```
`frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```
Never commit `.env` files. AI keys live **only** in the backend. Before deploying, change CORS in `backend/app.py` from `"*"` to `FRONTEND_ORIGIN`.

---

## Use the palette (do this first, everyone)

1. Replace `frontend/app/globals.css` with the CSS in **`DESIGN.md §10`** (Tailwind v4 has no config file; tokens live in `@theme`).
2. Add **`frontend/app/fonts.ts`** from `DESIGN.md §10`.
3. In `frontend/app/layout.tsx`, swap the Geist fonts for Bodoni Moda, Manrope and IBM Plex Mono.
4. Put **one mode class on every section**: `mode-arte` (story) or `mode-scienza` (cars).
5. Use the mode-aware utilities (`bg-bg`, `text-fg`, `text-muted`, `border-rule`, `bg-accent`, `text-on-accent`, `bg-panel`) so the same component works in day and night.

**Never hard-code a hex in a component.** If you need a colour that isn't a token, raise it with the team.

---

## Team ownership

| Who | Area | Routes | Folders | Branch |
|---|---|---|---|---|
| Person 1 | Opening experience | `/` | `frontend/app/(intro)` | `feat/intro` |
| Rupal | Cars + Legacy | `/collection`, `/collection/[model]`, `/legacy` | `frontend/app/collection`, `frontend/app/legacy`, `backend/routes/models.py` | `feat/collection-legacy` |
| Persons 3 + 4 | Customization + reserve | `/atelier/[model]`, `/reserve/[buildId]`, `/b/[buildId]` | `frontend/app/atelier`, `frontend/app/reserve`, `frontend/app/b`, `backend/routes/{builds,slots,reservations,ai}.py` | `feat/atelier` |

Shared (agree changes in the group first): `frontend/app/globals.css`, `frontend/app/fonts.ts`, `frontend/app/layout.tsx`, `frontend/lib/*`, `frontend/components/ui/*`, `backend/app.py`, `backend/db.py`.

### Handoffs
| From → To | URL |
|---|---|
| Opening → Collection | `/collection?from=intro` (opens in Scienza, Roadster first) |
| Collection → Atelier | `/atelier/<modelId>?slot=047` |
| Legacy "Chapter: Yours" → Atelier | `/atelier/<modelId>` |
| Atelier → Reserve | `/reserve/<buildId>` |

### Model IDs (use exactly these)
`utopia-coupe` · `utopia-roadster` · `codalunga-speedster`

---

## Project structure

```
frontend/
  app/
    (intro)/page.tsx            # opening: ignition + sketch reveal
    legacy/page.tsx             # timeline + sketchbook
    collection/page.tsx         # showroom, turntable, slot grid
    collection/[model]/page.tsx
    atelier/[model]/page.tsx    # by hand · by vision · ask the car
    reserve/[buildId]/page.tsx
    b/[buildId]/page.tsx        # private build link
    globals.css  fonts.ts  layout.tsx
  components/ui/                # buttons, chips, inputs, spec tiles (shared)
  lib/  api.ts  audio.ts  guest.ts

backend/
  app.py                        # FastAPI app, CORS, routers
  db.py                         # Mongo client
  routes/
    index.py
    models.py                   # GET  /api/models          models + slots remaining
    builds.py                   # POST /api/builds          validated spec (guest ID)
    slots.py                    # POST /api/slots/hold      atomic 15-min hold
    reservations.py             # POST /api/reservations    request → advisor email
    ai.py                       # POST /api/ask (Grok) · POST /api/render (Gemini)
```

---

## Before you open a PR

- [ ] Uses tokens only (no raw hex in components)
- [ ] One primary button per view, square corners
- [ ] Works at 375px wide
- [ ] Keyboard works (Tab, Enter, arrow keys on the turntable)
- [ ] `prefers-reduced-motion` respected
- [ ] No autoplay sound, no invented numbers, no prices in the UI
- [ ] No API keys in the frontend