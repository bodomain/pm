# CLAUDE.md - Kanban Studio Development Guide

## Project Overview

**Kanban Studio** is an AI-powered project management tool featuring a modern Kanban board with intelligent assistance. It's a monorepo containing a Next.js frontend and FastAPI backend, containerized with Docker.

**Purpose**: Provide a seamless Kanban board experience with AI assistance to help users organize tasks, track progress, and boost productivity.

**Default Credentials**:
- Username: `user`
- Password: `password`

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1 (App Router, React 19.2)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Testing**:
  - Vitest (unit tests)
  - Playwright (E2E tests)
  - Testing Library
- **Build Tool**: Next.js built-in

### Backend
- **Framework**: FastAPI (Python 3.12)
- **ORM**: SQLAlchemy
- **Database**: SQLite
- **AI**: OpenAI API (gpt-5-nano)
- **Package Manager**: uv

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Port**: 8000 (both API and UI served from same port)

---

## Project Structure

```
pm/
├── backend/                    # FastAPI backend
│   ├── main.py                # App entry point, API routes
│   ├── models.py              # SQLAlchemy database models
│   ├── schemas.py             # Pydantic schemas (request/response validation)
│   ├── crud.py                # Database operations (CRUD)
│   ├── ai_service.py          # OpenAI integration
│   ├── database.py            # DB connection/session management
│   ├── pyproject.toml         # Python dependencies (uv)
│   ├── uv.lock                # Dependency lock file
│   ├── tests/                 # Backend tests (pytest)
│   ├── static/                # Static files (served by FastAPI)
│   └── test.db                # SQLite database (auto-generated)
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout
│   │   │   ├── page.tsx       # Main page (auth gateway)
│   │   │   └── globals.css    # Global styles
│   │   ├── components/
│   │   │   ├── KanbanBoard.tsx      # Main board container
│   │   │   ├── KanbanColumn.tsx     # Individual column
│   │   │   ├── KanbanCard.tsx       # Card component
│   │   │   ├── KanbanCardPreview.tsx # Drag preview
│   │   │   ├── NewCardForm.tsx      # Card creation form
│   │   │   ├── Login.tsx            # Login page
│   │   │   ├── AIChatSidebar.tsx    # AI chat interface
│   │   │   └── *.test.tsx           # Component tests
│   │   └── lib/
│   │       ├── kanban.ts      # Business logic (moveCard, createId, etc.)
│   │       └── kanban.test.ts # Logic unit tests
│   ├── public/                # Static assets
│   ├── tests/                 # E2E tests (Playwright)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── vitest.config.ts
│
├── scripts/
│   ├── start.sh              # Build & run Docker container
│   └── stop.sh               # Stop Docker container
│
├── docker-compose.yml        # Docker Compose config
├── Dockerfile                # Multi-stage build (frontend + backend)
├── .env                      # Environment variables (excluded from git)
├── README.md                 # User-facing documentation
├── AGENTS.md                 # Notes for Claude Code agents
└── CLAUDE.md                 # This file (developer reference)
```

---

## Key Components & Architecture

### Frontend Architecture

**State Management**: Local React state with optimistic updates.
- Board state stored in `KanbanBoard` component
- Immediate UI updates before API confirmation
- Synchronization with backend on drag end, card creation, deletion

**ID Mapping**: Frontend uses prefixed IDs (`col-1`, `card-2`) to distinguish from backend numeric IDs.
- `toColId(num)` → `"col-{num}"`
- `toCardId(num)` → `"card-{num}"`
- `fromPrefixedId(str)` → numeric backend ID

**Drag & Drop**:
- Uses `@dnd-kit` library
- `moveCard()` function in `lib/kanban.ts` handles all reorder logic
- Supports:
  - Moving cards between columns
  - Reordering within same column
  - Visual feedback with `DragOverlay`

**API Integration**:
- Frontend runs from same origin as backend (`/api/*`)
- Backend serves built Next.js static files from `/app/static`
- Key endpoints:
  - `GET /api/users/user` → fetch dummy user
  - `GET /api/users/{id}/boards` → fetch user's boards
  - `POST /api/cards` → create card
  - `PATCH /api/cards/{id}` → update card
  - `DELETE /api/cards/{id}` → delete card
  - `POST /api/columns` → create column (not currently used)
  - `PATCH /api/columns/{id}` → rename column
  - `DELETE /api/columns/{id}` → delete column (not currently used)
  - `POST /api/ai/chat` → AI chat with board context

### Backend Architecture

**Models** (in `models.py`):
- `User`: id, username, password_hash, boards (1:N)
- `Board`: id, title, user_id, columns (1:N)
- `Column`: id, title, order, board_id, cards (1:N)
- `Card`: id, title, description, order, column_id

**CRUD Operations** (in `crud.py`):
- Simple functions for each model
- Standard Create, Read, Update, Delete
- No authentication/authorization layer (dummy user only)

**AI Integration** (in `ai_service.py`):
- `ask_math_question()`: Simple test endpoint
- `process_chat()`: Main AI chat with board context
  - Accepts user message and board state JSON
  - Returns `AIResponse` with:
    - `response_message`: Natural language reply to user
    - `operations`: List of actions (add_card, update_card, delete_card)
  - Backend automatically executes operations on database

**API Design**:
- RESTful endpoints with FastAPI
- SQLAlchemy sessions via `Depends(get_db)`
- Pydantic schemas for request/response validation
- Automatic JSON serialization

**Data Flow for AI Chat**:
1. Frontend sends `{ message, user_id }` to `/api/ai/chat`
2. Backend fetches board data for user
3. Backend calls OpenAI with board context + user message
4. AI returns structured operations via Pydantic parsing
5. Backend executes operations in order
6. Backend returns updated board + AI response message
7. Frontend updates state with new board

---

## Development Workflow

### Quick Start

1. **Clone & setup** (if needed)
```bash
cd /home/user/Desktop/aicoder/pm
```

2. **Start development** (build & run)
```bash
./scripts/start.sh
```

3. **Access application**
- UI: http://localhost:8000/
- API: http://localhost:8000/api/hello
- Login: `user` / `password`

4. **Stop application**
```bash
./scripts/stop.sh
```

### Local Development (without Docker)

**Backend**:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uv sync
uvicorn main:app --reload --port 8000
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000 (needs proxy to backend)
```

**Note**: The frontend expects backend on same origin. For separate dev servers, you'd need to configure Next.js to proxy `/api` requests to `localhost:8000`.

---

## Testing

### Frontend Tests

```bash
cd frontend

# Unit tests (Vitest)
npm run test:unit
npm run test:unit:watch  # watch mode

# E2E tests (Playwright)
npm run test:e2e

# All tests
npm run test:all
```

**Test files**: Next to components (`*.test.tsx`) in `src/components/` and `src/lib/`

### Backend Tests

```bash
cd backend
pytest
```

**Test files**: In `backend/tests/`

---

## Environment Variables

Create `.env` file in project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

If not set, AI features will fail.

---

## Database

- **Type**: SQLite
- **Location**: `backend/test.db` (auto-created on first run)
- **Auto-initialization**: On app startup, creates dummy user/board if none exist
- **Schema**: Defined in `models.py` (SQLAlchemy)
- **Migrations**: None (uses `Base.metadata.create_all()`)

**Manual DB operations** (using Python):
```bash
cd backend
python -c "from database import SessionLocal; from crud import get_boards; db = SessionLocal(); print(get_boards(db, 1)); db.close()"
```

---

## Making Changes

### Adding a new API endpoint

1. Define Pydantic schemas in `backend/schemas.py`
2. Add CRUD function in `backend/crud.py` (if needed)
3. Add FastAPI route in `backend/main.py`
4. Test with curl or frontend

### Adding a new component

1. Create file in `frontend/src/components/`
2. Write component with TypeScript types
3. Add test file `ComponentName.test.tsx`
4. Export from component index (or import directly where needed)

### Modifying board logic

- Drag & drop logic: `frontend/src/lib/kanban.ts` (pure functions, easily testable)
- State management: `KanbanBoard` component handles all board operations

### Adding AI capabilities

1. Define new Pydantic models in `ai_service.py` if needed
2. Update `process_chat()` prompt to handle new operation types
3. Add operation handling in `/api/ai/chat` endpoint
4. Add UI for new AI features (likely in `AIChatSidebar.tsx`)

---

## Important Conventions

### TypeScript
- Strict mode enabled
- React 19 compiler (JSX transform)
- Path aliases: `@/*` → `frontend/src/*`
- Client components marked with `"use client"`

### Python
- Type hints used throughout
- Uses Pydantic for validation
- Async functions where I/O operations occur (`ai_service.py`, chat endpoint)
- CRUD functions are synchronous (SQLAlchemy)

### Git
- `.gitignore` includes:
  - `node_modules/`
  - `.venv/`
  - `.env`
  - `test.db`
  - `uv.lock` (but frontend keeps `package-lock.json`)
- Docker images not committed
- Frontend build output not committed (`.next/`)

---

## Common Commands

```bash
# Build & run (Docker)
./scripts/start.sh

# Stop (Docker)
./scripts/stop.sh

# Docker manual
docker build -t kanban-studio .
docker run -d -p 8000:8000 --env-file .env kanban-studio
docker stop kanban-studio && docker rm kanban-studio

# Frontend
cd frontend
npm run dev        # development server (3000)
npm run build      # production build
npm run start      # start production server
npm run lint       # ESLint
npm run test:unit  # unit tests

# Backend
cd backend
uvicorn main:app --reload --port 8000
pytest
```

---

## API Reference

### Authentication
Currently uses simple localStorage flag. No real auth backend.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hello` | Health check |
| GET | `/api/users/{username}` | Get user by username |
| GET | `/api/users/{user_id}/boards` | Get all boards for user |
| POST | `/api/boards` | Create new board |
| POST | `/api/columns` | Create new column |
| PATCH | `/api/columns/{id}` | Update column (title, order) |
| DELETE | `/api/columns/{id}` | Delete column |
| POST | `/api/cards` | Create new card |
| PATCH | `/api/cards/{id}` | Update card (title, description, order, column_id) |
| DELETE | `/api/cards/{id}` | Delete card |
| GET | `/api/ai/test` | Test AI connectivity |
| POST | `/api/ai/chat` | Chat with AI about board |

---

## Troubleshooting

**Issue**: AI chat returns 500 error
**Fix**: Set `OPENAI_API_KEY` in `.env` file

**Issue**: Changes lost after restart
**Fix**: Database is SQLite file `backend/test.db`. Ensure it's writable.

**Issue**: Frontend shows old data after drag
**Fix**: Check network tab - API calls on drag end may have failed. Look for PATCH requests.

**Issue**: Docker container won't start (port 8000 in use)
**Fix**: Stop other service or change port mapping in `scripts/start.sh` and `docker-compose.yml`

**Issue**: E2E tests fail
**Fix**: Ensure Docker container is running (`./scripts/start.sh` first)

---

## Notes for Claude Code

When working in this codebase:

- **Edit existing files**: Never create new files unless absolutely necessary
- **Frontend state**: Optimistic updates are key - follow pattern in `KanbanBoard`
- **ID conversion**: Always use `toCardId/toColId` or `fromPrefixedId` for API calls
- **API base**: Use relative paths `/api/...` (same origin)
- **Backend**: Keep it simple - CRUD functions in `crud.py`, routes in `main.py`
- **AI**: Business logic in `ai_service.py`, execution in endpoint
- **Testing**: Add tests alongside files (`*.test.tsx` or `test_*.py`)
- **Styling**: Use Tailwind classes, follow existing pattern
- **Docker**: Changes to Dockerfile require rebuild: `docker build -t kanban-studio .`

---

## Useful Patterns

### Optimistic UI Update Pattern

```tsx
// 1. Optimistic update
setBoard(prev => ({ ...prev, cards: { ...prev.cards, [newId]: newCard } }));

// 2. API call
const res = await fetch("/api/cards", { ... });

// 3. Rollback or replace ID on success/failure
if (res.ok) {
  const realCard = await res.json();
  // replace optimistic ID with real ID
} else {
  // revert state
}
```

### Converting IDs

```tsx
// Frontend → Backend
const backendId = fromPrefixedId(frontendId); // "card-5" → 5

// Backend → Frontend
const frontendId = toCardId(backendId); // 5 → "card-5"
```

---

## Open Questions / Future Improvements

- Column reordering (currently only cards can be reordered)
- Multiple boards / board switching
- Real authentication (currently dummy user)
- Password hashing (currently plaintext)
- Board customization (colors, names, etc.)
- AI operation validation (currently executes all returned ops)
- Better error handling & user notifications
- Loading states during API calls
- Proper API error responses

---

**Last Updated**: 2026-02-24
**Maintainer**: Kanban Studio Team
