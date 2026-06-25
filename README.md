<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layers.svg" alt="TaskFlow Logo" width="80" height="80">
  <h1 align="center">TaskFlow</h1>
  <p align="center">
    <strong>An Enterprise-Grade, AI-Powered Task & Project Management Platform</strong>
  </p>
  <p align="center">
    <a href="#tech-stack">Tech Stack</a> • 
    <a href="#features">Features</a> • 
    <a href="#ai-integration">AI Architecture</a> • 
    <a href="#getting-started">Getting Started</a> • 
    <a href="#api-reference">API Documentation</a>
  </p>
</div>

---

## 📖 Overview

**TaskFlow** is a modern, full-stack Kanban-style project management application built with the MERN stack. Designed with scalability and user experience in mind, it provides a seamless interface for managing complex workflows, bolstered by a lightweight Artificial Intelligence integration for automated task effort and deadline estimation.

> 📸 *Add your screenshots here before submitting!*
>
> **Live Frontend:** [Your Vercel/Netlify Link Here]  
> **Live Backend:** [Your Render/Railway Link Here]  
> **Test Credentials:** `test@example.com` / `password123`

---

## ✨ Enterprise Features

- **Robust Authentication:** Secure JWT-based session management with Bcrypt password hashing (Cost Factor 12) and strict ownership-based route protection.
- **AI-Powered Estimations:** Integrates with **Groq (Llama-3.1-8b-instant)** to instantly generate intelligent effort estimates and suggested due dates based on task descriptions.
- **Dynamic Kanban Board:** Fluid drag-and-drop mechanics using `@dnd-kit/core` with optimistic UI updates and real-time state synchronization.
- **Advanced Analytics:** Interactive Dashboard utilizing Recharts to visualize task distributions and project health metrics.
- **Production-Ready UI:** Responsive, accessible, and meticulously styled using Tailwind CSS, featuring persistent Dark Mode and polished skeleton loading states.
- **Resilient Backend Architecture:** Centralized error handling, exhaustive Zod schema validation, and graceful fallback mechanisms ensuring 100% uptime even if third-party APIs fail.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6 |
| **State Management** | TanStack Query v5 (Server State), Zustand (Client State) |
| **Styling & UI** | Tailwind CSS v3, Recharts, Lucide Icons |
| **Backend Framework** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Security & Auth** | JSON Web Tokens (JWT), Bcrypt.js, CORS |
| **Validation** | Zod (Strict payload validation middleware) |
| **AI Integration** | Groq SDK (`llama-3.1-8b-instant`) |

---

## 🧠 AI Integration Strategy

**Provider Choice:** [Groq](https://groq.com/) API using the `llama-3.1-8b-instant` model.

**Reasoning:** Groq provides unparalleled inference speeds (LPU), ensuring the AI estimation feels instantaneous to the user. The `llama-3.1-8b-instant` model is highly capable of structured JSON output and perfectly suited for lightweight semantic analysis without exhausting free-tier constraints.

**Implementation Details:**
- **Security:** The API key is securely isolated on the Node.js server. The client never interacts with the LLM directly.
- **Resilience:** Wrapped in an 8-second `AbortController` timeout.
- **Graceful Degradation:** If the API times out, the quota is exceeded, or JSON parsing fails, the backend seamlessly triggers a deterministic fallback heuristic, ensuring the end-user experiences zero disruption.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas cluster (or local instance)
- Groq API Key

### 1. Clone & Install
```bash
git clone <repository-url>
cd TaskFlow

# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `/server` directory based on the provided `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<your-cluster-uri>
JWT_SECRET=your_super_secret_key_32_chars
GROQ_API_KEY=gsk_your_groq_api_key_here
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run the Application
Start both development servers concurrently.

**Backend:**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Frontend:**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

---

## 📡 API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/register` | Register a new user | ❌ |
| `POST` | `/login` | Authenticate and retrieve JWT | ❌ |
| `GET` | `/me` | Retrieve current user profile | ✅ |

### Boards (`/api/boards`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Retrieve all boards owned by user | ✅ |
| `POST` | `/` | Create a new board | ✅ |
| `PATCH` | `/:id` | Update board details | ✅ |
| `DELETE` | `/:id` | Delete board (Cascades to tasks) | ✅ |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/boards/:boardId/tasks` | Retrieve all tasks for a specific board | ✅ |
| `POST` | `/boards/:boardId/tasks` | Create a new task in a board | ✅ |
| `PATCH` | `/:id` | Update task (Status, Priority, Meta) | ✅ |
| `DELETE` | `/:id` | Delete a task | ✅ |
| `POST` | `/ai-estimate` | Generate AI Effort/Date estimate | ✅ |

---

## 🔮 Known Issues & Future Roadmap
Given more time, the following enhancements would be prioritized:
1. **Real-time Collaboration:** Implement `Socket.io` to allow multiple users to edit the same board concurrently without refreshing.
2. **Advanced Analytics:** Build a dedicated `/api/analytics` aggregate endpoint for deeper, board-spanning insights into task completion velocity.
3. **Pagination & Infinite Scroll:** Implement cursor-based pagination on the task endpoints to support boards with 1,000+ tasks efficiently.
4. **Integration Testing:** Expand the test suite using Supertest and Jest to cover all edge cases in the Board and Task controllers.

---

<div align="center">
  <p>Designed & Engineered by <strong>Shreyansh Jain</strong></p>
</div>
