# task-management-system

Task management system with a React frontend, Node.js/Express backend, TypeScript and WebSocket real-time updates. Data lives in an in-memory repository persisted to a JSON file (`server/src/store.ts` is the single persistence boundary, so swapping in MongoDB means re-implementing that one class).

## Features

- Kanban board (To do / In progress / Done) with drag and drop
- REST API with zod validation: create, list (filter by status/assignee), update, delete, stats
- WebSocket channel (`/ws`): every change is broadcast, so all open browsers update live
- Auto-reconnecting client with heartbeat on the server side
- Integration tests for the API and the real-time channel

## Getting started

```bash
npm install
npm run dev:server    # http://localhost:3001  (API + WebSocket)
npm run dev:client    # http://localhost:5173  (proxies /api and /ws)
npm test              # server integration tests
npm run typecheck
npm run build
```

Environment variables: `PORT` (default 3001), `DATA_FILE` (default `data/tasks.json`).

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness |
| GET | `/api/stats` | Counts by status and priority |
| GET | `/api/tasks?status=&assignee=` | List tasks |
| POST | `/api/tasks` | Create (`title`, optional `description`, `status`, `priority`, `assignee`) |
| PATCH | `/api/tasks/:id` | Partial update |
| DELETE | `/api/tasks/:id` | Delete |

WebSocket events: `task.created`, `task.updated`, `task.deleted`.

## Structure

```
server/   Express + ws + zod (src/, test/)
client/   React + Vite (src/components, hooks, api client)
```
