# OrbitBoard

OrbitBoard is a full-stack collaborative editorial workflow platform for teams that manage content through groups, boards, lists, review stages, comments, notifications, and activity history. It combines a Kanban-style workspace with article editing, role-based access, OTP authentication, and review handoffs between writer and editor boards.

## Features

- User authentication with email OTP verification, password reset OTP, Google sign-in, JWT access tokens, and httpOnly refresh-token cookies.
- Group workspaces where users can create teams, invite members, manage roles, and organize multiple boards.
- Board and list management with active, closed, archived, and restored workflow states.
- Article workflow management with rich-text editing, autosave, status transitions, drag-and-drop movement, review copies, and version comparison.
- Role-based collaboration for admins, editors, and writers across groups, boards, articles, comments, and review actions.
- Comment threads with mention support, notification creation, unread counts, and notification deep links.
- Activity logging for article creation, edits, status changes, review handoffs, comments, copy deletion, and related audit events.
- Production-ready client build with route-level code splitting to reduce initial bundle size.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Zustand
- TanStack React Query
- Axios
- React Hook Form
- Zod
- Tiptap rich-text editor
- Tailwind CSS
- ESLint

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs password hashing
- Google Auth Library
- Resend email delivery for OTP emails
- Helmet
- CORS
- Morgan
- Cookie Parser
- Zod validation

## Project Structure

```text
OrbitBoard/
├── client/                 # React + Vite frontend
│   ├── src/api/            # Axios API client
│   ├── src/components/     # Shared UI and workflow components
│   ├── src/pages/          # Route-level pages
│   └── src/store/          # Zustand auth store
├── server/                 # Express + MongoDB backend
│   └── src/
│       ├── controllers/    # Request handlers
│       ├── lib/            # Tokens, email, validation, logging helpers
│       ├── middleware/     # Auth, validation, error handling
│       ├── models/         # Mongoose schemas
│       └── routes/         # API routes
└── package.json            # Root validation scripts
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- MongoDB database
- Resend API key for OTP emails
- Google OAuth client ID for Google sign-in

### Installation

```bash
npm install --prefix client
npm install --prefix server
```

### Environment Variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
GOOGLE_CLIENT_ID=your_google_client_id
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Run Locally

Start the backend:

```bash
npm --prefix server run dev
```

Start the frontend:

```bash
npm --prefix client run dev
```

The client runs on the Vite development URL, usually `http://localhost:5173`, and the API runs on `http://localhost:5000`.


## API Overview

- `POST /api/auth/register` sends an OTP for registration.
- `POST /api/auth/register/verify` verifies registration OTP and creates a user.
- `POST /api/auth/login` signs in a user.
- `POST /api/auth/google` signs in with Google.
- `POST /api/auth/forgot-password/send-otp` starts password recovery.
- `GET /api/groups` returns the current user's groups.
- `POST /api/groups` creates a group.
- `GET /api/boards/group/:groupId` returns boards in a group.
- `POST /api/boards` creates a board.
- `GET /api/lists/board/:boardId` returns board lists.
- `POST /api/articles` creates an article.
- `PATCH /api/articles/:id/move` moves an article between lists.
- `POST /api/review/pick` sends an article copy to an editor board.
- `GET /api/notifications` returns notifications and unread counts.
- `GET /api/activity/:articleId` returns article activity history.
