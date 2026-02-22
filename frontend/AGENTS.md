# Frontend Architecture & Existing Code

The `frontend` directory contains the MVP React/Next.js application, focusing on the UI for the Kanban board and an AI Chat Sidebar. It relies on standard modern web technologies and testing frameworks.

## Tech Stack
- **Framework**: Next.js 16.1 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4, `clsx` for dynamic cases
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Testing**: Vitest (Unit tests), Playwright (E2E tests), Testing Library
- **Tooling**: TypeScript, ESLint

## Directory Structure
- `src/app/`: Next.js App Router entry points (e.g., `page.tsx`, `layout.tsx`, `globals.css`).
- `src/components/`: Core UI components for the application.
  - `KanbanBoard.tsx`: Main container managing columns and overall board state.
  - `KanbanColumn.tsx`: Renders individual columns and handles drop zones.
  - `KanbanCard.tsx` / `KanbanCardPreview.tsx`: Renders individual task cards and the dragging preview state.
  - `NewCardForm.tsx`: Form UI for adding a new card.
  - `AIChatSidebar.tsx`: UI for the AI chat widget, including message history and input.
- `src/lib/`: Shared utilities and logic.
  - `kanban.ts`: Types, state definitions, and helper functions for Kanban logic.
- `tests/`: End-to-end tests for Playwright.

## Current State
- The frontend is a standalone presentation layer with mock data and state managed purely in the client (React state/props).
- `@dnd-kit` is used extensively for the drag-and-drop interactions of the Kanban cards.
- Testing is set up, including a mix of unit components and comprehensive E2E playwright definitions.
- The `AIChatSidebar` is currently a UI shell and is not yet connected to a live backend API.

## Instructions for Agents Editing Frontend Code
1. Adhere strictly to the defined color scheme in the root `AGENTS.md` (Accent Yellow, Blue Primary, Purple Secondary, Dark Navy, Gray Text).
2. Avoid over-engineering; integrate directly with the existing Next.js structure and Tailwind classes.
3. Ensure static exporting is compatible when modifying components, as the build output will be served statically by the FastAPI backend.
