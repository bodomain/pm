# High level steps for project

## Part 1: Plan
Enrich this document to plan out each of these parts in detail, with substeps listed out as a checklist to be checked off by the agent, and with tests and success critieria for each. Also create an AGENTS.md file inside the frontend directory that describes the existing code there. Ensure the user checks and approves the plan.
- [x] Check `AGENTS.md` and `docs/PLAN.md`
- [x] Write detailed checklists, tests, and success criteria for all parts in `docs/PLAN.md`
- [x] Review existing `frontend` code
- [x] Create `frontend/AGENTS.md` to describe the existing React/NextJS code
- [ ] Request user review of the plan
**Tests/Success Criteria**: User reviews and approves the updated `PLAN.md` and `frontend/AGENTS.md`.

## Part 2: Scaffolding
Set up the Docker infrastructure, the backend in backend/ with FastAPI, and write the start and stop scripts in the scripts/ directory. This should serve example static HTML to confirm that a 'hello world' example works running locally and also make an API call.
- [x] Initialize basic FastAPI app in `backend/` with a simple `/api/hello` route and serving static files from `backend/static`.
- [x] Write `Dockerfile` and `docker-compose.yml` to package the backend using `uv`.
- [x] Create `scripts/start.sh` and `scripts/stop.sh` scripts for multi-platform (or OS specific).
- [x] Add a dummy `index.html` in `backend/static` for "hello world".
**Tests/Success Criteria**: Running `scripts/start.sh` starts the container. Going to `http://localhost:8000` shows "hello world". Calling `http://localhost:8000/api/hello` returns a JSON response.

## Part 3: Add in Frontend
Now update so that the frontend is statically built and served, so that the app has the demo Kanban board displayed at /. Comprehensive unit and integration tests.
- [x] Update frontend build to output a static export (`out` directory).
- [x] Configure `next.config.ts` for static export (`output: 'export'`).
- [x] Update `Dockerfile` to build the Next.js static site and copy `out/` to the FastAPI static directory.
- [x] Update FastAPI backend to serve the `index.html` from the frontend build at `/`.
- [x] Ensure frontend unit tests and e2e tests run successfully.
**Tests/Success Criteria**: Running the Docker container serves the Kanban board React frontend at the root URL `/`. All frontend tests (`npm run test:all`) pass.

## Part 4: Add in a fake user sign in experience
Now update so that on first hitting /, you need to log in with dummy credentials ("user", "password") in order to see the Kanban, and you can log out. Comprehensive tests.
- [x] Create a dummy `Login` component in frontend.
- [x] Wrap the `KanbanBoard` in an auth guard that checks for login state (could be stored in localStorage or context).
- [x] Implement logout functionality.
- [x] Add unit and E2E tests for the login/logout flow.
**Tests/Success Criteria**: The user is prompted for credentials when visiting `/`. Entering "user" and "password" grants access to the Kanban board. Clicking logout returns them to the login screen.

## Part 5: Database modeling
Now propose a database schema for the Kanban, saving it as JSON. Document the database approach in docs/ and get user sign off.
- [x] Design the SQLite schema for users, boards, columns, and cards.
- [x] Map the schema to SQLAlchemy models (or similar Python ORM/SQL approach).
- [x] Write `docs/DATABASE.md` detailing the schema, tables, and relationships.
- [ ] Request user review of the DB approach.
**Tests/Success Criteria**: `docs/DATABASE.md` exists and clearly documents the schema. User approves the design before implementation.

## Part 6: Backend
Now add API routes to allow the backend to read and change the Kanban for a given user; test this thoroughly with backend unit tests. The database should be created if it doesn't exist.
- [x] Implement database initialization script (creates SQLite DB on startup).
- [x] Create FastAPI CRUD routes for boards, columns, and cards.
- [x] Write pytest tests for all CRUD operations, including isolated DB test setups.
**Tests/Success Criteria**: All backend unit tests pass. API endpoints return correct HTTP statuses and data for valid and invalid requests. SQLite file is generated successfully locally.

## Part 7: Frontend + Backend
Now have the frontend actually use the backend API, so that the app is a proper persistent Kanban board. Test very throughly.
- [ ] Replace mock data in frontend with `fetch` calls to backend `/api` endpoints.
- [ ] Update drag-and-drop handlers to send position/column updates to the backend.
- [ ] Update add/edit/delete card handlers to persist via backend.
- [ ] Ensure optimistic UI updates or loading spinners are present for good UX.
**Tests/Success Criteria**: User can use the Kanban board normally, refresh the page, and all changes (card movements, new cards) are persisted and reloaded from the backend. E2E tests pass.

## Part 8: AI connectivity
Now allow the backend to make an AI call via OpenAI. Test connectivity with a simple "2+2" test and ensure the AI call is working.
- [ ] Configure `OPENAI_API_KEY` from `.env`.
- [ ] Add an AI service module in FastAPI using the `openai` python library pointing to the official OpenAI API (using `gpt-5-nano` as per `AGENTS.md`).
- [ ] Create a simple `/api/ai/test` endpoint that prompts the model with "What is 2+2?".
- [ ] Write a test to ensure this endpoint returns "4".
**Tests/Success Criteria**: Calling `/api/ai/test` successfully connects to the LLM and returns the correct response.

## Part 9: AI with Kanban
Now extend the backend call so that it always calls the AI with the JSON of the Kanban board, plus the user's question (and conversation history). The AI should respond with Structured Outputs that includes the response to the user and optionaly an update to the Kanban. Test thoroughly.
- [ ] Define Structured Outputs schema (JSON schema) for the AI response (message + optional board operations).
- [ ] Create an endpoint `/api/ai/chat` that accepts user message, gathers current board state from DB, and sends both as context to the AI.
- [ ] Process AI response: if board operations are present, apply them directly to the database.
- [ ] Return the AI's textual response and the new board state.
- [ ] Write backend tests mocking the AI to ensure operations are applied correctly to the DB.
**Tests/Success Criteria**: The backend correctly applies AI-generated mutations to the database (e.g., adding a card when the user asks for it) based on defined user queries.

## Part 10: Beautiful sidebar widget
Now add a beautiful sidebar widget to the UI supporting full AI chat, and allowing the LLM (as it determines) to update the Kanban based on its Structured Outputs. If the AI updates the Kanban, then the UI should refresh automatically.
- [ ] Incorporate `AIChatSidebar.tsx` into the main layout allowing it to toggle or sit alongside the board.
- [ ] Connect the chat UI to `/api/ai/chat` endpoint.
- [ ] Automatically update the frontend Kanban board state when the API response includes a changed board state.
- [ ] Add polish, transitions, and adhere to color scheme (Yellow/Blue/Purple from `AGENTS.md`).
**Tests/Success Criteria**: User can type "Add a card for writing tests" into the sidebar, the AI responds in chat, and the card immediately appears on the board without a manual page refresh.