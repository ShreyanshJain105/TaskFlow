# TaskFlow

A Kanban-style project management app built with the MERN stack. Supports drag-and-drop task management, AI-powered effort estimation via Groq, and a real-time analytics dashboard.

**Live:** https://task-flow-live.vercel.app  
**API:** https://taskflow-api-da5l.onrender.com  
**Test account:** `test@example.com` / `password123`

---

## Features

- **Kanban boards** — drag tasks between To Do, In Progress, and Done columns with optimistic UI updates
- **AI estimation** — uses Groq (`llama-3.1-8b-instant`) to suggest effort size and due dates from a task title and description; falls back gracefully if the API is unavailable
- **Analytics dashboard** — bar chart showing task distribution across boards
- **Dark mode** — persisted via Zustand + localStorage
- **JWT auth** — bcrypt password hashing, ownership-scoped routes throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Backend | Node.js, Express |
| Database | MongoDB Atlas + Mongoose |
| Validation | Zod |
| Auth | JWT + bcryptjs |
| AI | Groq SDK |

---

## Project Structure

```
taskflow/
├── client/                 # Vite + React frontend
│   ├── src/
│   │   ├── api/            # Axios instance with JWT interceptors
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Route-level page components
│   │   └── store/          # Zustand stores (theme)
│   └── .env.example
└── server/                 # Express backend
    ├── src/
    │   ├── config/         # MongoDB connection
    │   ├── controllers/    # Request handlers
    │   ├── middleware/      # protect, errorHandler, validate, notFound
    │   ├── models/         # Mongoose schemas
    │   ├── routes/         # Express routers
    │   ├── schemas/        # Zod validation schemas
    │   └── utils/          # Groq AI helper
    └── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local instance)
- Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Install dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 2. Configure environment variables

**Server** — copy `server/.env.example` to `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskflow
JWT_SECRET=<long-random-string-min-32-chars>
GROQ_API_KEY=gsk_...
CLIENT_ORIGIN=http://localhost:5173
```

**Client** — copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run

```bash
# Terminal 1 — backend (nodemon, auto-restarts on changes)
cd server && npm run dev

# Terminal 2 — frontend (Vite HMR)
cd client && npm run dev
```

Open `http://localhost:5173`.

---

## API Reference

All routes marked **🔒** require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/register` | Create account | — |
| POST | `/login` | Sign in, returns JWT | — |
| GET | `/me` | Current user | 🔒 |

### Boards — `/api/boards`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/` | List boards (includes task count) | 🔒 |
| POST | `/` | Create board | 🔒 |
| PATCH | `/:id` | Update title/description | 🔒 |
| DELETE | `/:id` | Delete board + cascade delete its tasks | 🔒 |

### Tasks — `/api/boards/:boardId/tasks` and `/api/tasks`

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/boards/:boardId/tasks` | List tasks for a board | 🔒 |
| POST | `/api/boards/:boardId/tasks` | Create task | 🔒 |
| PATCH | `/api/tasks/:id` | Update task fields | 🔒 |
| DELETE | `/api/tasks/:id` | Delete task | 🔒 |
| POST | `/api/tasks/ai-estimate` | Get AI effort/due date estimate | 🔒 |

---

## AI Estimation

The `/api/tasks/ai-estimate` endpoint takes a task title and description and returns:

```json
{
  "estimatedEffort": "half day",
  "suggestedDueDate": "2025-07-04",
  "reasoning": "Moderate complexity UI change with clear scope.",
  "fallback": false
}
```

If the Groq API is unavailable or times out (8s limit), `fallback: true` is returned with a heuristic estimate based on description length — the user always gets a response.

---

## Design Decisions

**Why Groq over OpenAI?** Groq's LPU inference is significantly faster for small models, which matters for a feature triggered mid-form-fill. The latency difference is noticeable.

**Why TanStack Query + Zustand instead of Redux?** Server state (boards, tasks) and client state (theme, modal visibility) have completely different lifecycles. Using a server-state library for server data and a minimal store for UI state is simpler and more maintainable than a single Redux store trying to do both.

**Optimistic updates on drag-and-drop** — `queryClient.setQueryData` updates the UI immediately on drag, with a `PATCH` fired in the background. If the request fails, the cache is invalidated and the board snaps back to server state. This avoids the janky lag of waiting for a round-trip on every drag.

---

## Known Limitations / Future Work

- **No real-time sync** — two users on the same board won't see each other's changes without refreshing. Socket.io would fix this.
- **No pagination** — boards with hundreds of tasks will load everything at once. Cursor-based pagination on task endpoints would be the right fix.
- **Single timezone** — due dates are stored as UTC and displayed in the browser's local timezone; users in negative UTC offsets may see off-by-one-day display issues on exact-midnight dates.

---

*Built by [Shreyansh Jain](https://github.com/ShreyanshJain105)*
