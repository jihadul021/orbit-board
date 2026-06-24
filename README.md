# OrbitBoard

## **Live site:** [orbitboard.space](https://www.orbitboard.space)

OrbitBoard is a full-stack editorial workflow platform for content teams. Writers own original articles, editors work on separate review copies, and admins get a cross-board overview of all content without losing original drafts.

## Features

- **Authentication** — Email OTP registration and password reset, Google sign-in, JWT access tokens, httpOnly refresh-token cookies, profile and password updates.
- **Groups & Members** — Group workspaces with admin roles, member invitations, removal, and leave support.
- **Boards** — Writer, editor, and admin roles with automatic group-admin access, active and closed board states, and a system-generated admin overview board per group.
- **Kanban Workflow** — Lists with archiving, article ordering, drag-and-drop movement, and read-only enforcement on closed boards.
- **Article Editing** — Tiptap rich-text editor with JSON storage, autosave, manual save, status transitions, and role-aware edit and delete controls.
- **Review Pipeline** — Editors work on a separate copy of each article while the original is locked and preserved.
- **Version Comparison** — Side-by-side view of the original draft against the latest edited copy after review or publication.
- **Admin Overview** — Aggregates all articles across a group's boards, grouped by status, showing the latest review copy when one exists.
- **Comments** — Threaded replies with mention support, role-aware permissions, unread counts, and notification deep links.
- **Notifications** — Events for review pickup, returned articles, mentions, and status changes.
- **Activity Log** — Audit trail covering article creation, review events, status changes, and comments.

## Editorial Workflow

1. A writer creates an article on a writer board.
2. An editor picks the article for review, creating a copy on an editor or admin board.
3. The original is locked; editors modify only the copy.
4. When the copy is marked reviewed or published, the original stores the edited title and body for comparison.
5. Admin overview displays the copy for reviewed and published work and opens it for further edits.
6. Version comparison always shows original content alongside the latest edited copy.

## Tech Stack

**Frontend** — React, Vite, React Router, Zustand, Axios, Tiptap, Tailwind CSS, Zod

**Backend** — Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Google Auth Library, Resend, Helmet, Zod

## Project Structure

```text
OrbitBoard/
├── client/
│   └── src/
│       ├── api/          # Axios client
│       ├── components/   # Shared UI components
│       ├── pages/        # Route-level pages
│       └── store/        # Zustand auth store
└── server/
    └── src/
        ├── controllers/  # Request handlers
        ├── lib/          # Helpers and utilities
        ├── middleware/   # Auth, validation, error handling
        ├── models/       # Mongoose schemas
        └── routes/       # API routes
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB
- Resend API key
- Google OAuth client ID

### Install

```bash
npm install --prefix client
npm install --prefix server
```

### Environment Variables

`client/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

`server/.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
GOOGLE_CLIENT_ID=your_google_client_id
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Run

```bash
npm --prefix server run dev
npm --prefix client run dev
```

Client runs on `http://localhost:5173`, API on `http://localhost:5000`.

### Validate

```bash
npm test
```

Runs client linting, a production build, and Node syntax checks on server files.

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Send registration OTP |
| POST | `/api/auth/register/verify` | Verify OTP and create user |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/google` | Google sign-in |
| POST | `/api/auth/logout` | Clear refresh token |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/update-profile` | Update profile |
| PATCH | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password/send-otp` | Start password recovery |
| POST | `/api/auth/forgot-password/verify-otp` | Verify reset OTP |
| POST | `/api/auth/forgot-password/reset` | Reset password |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups` | Create group |
| GET | `/api/groups/:id` | Get group |
| PATCH | `/api/groups/:id` | Rename group |
| POST | `/api/groups/:id/invite` | Invite member |
| DELETE | `/api/groups/:id/remove/:userId` | Remove member |
| DELETE | `/api/groups/:id/leave` | Leave group |

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/group/:groupId` | Active boards |
| GET | `/api/boards/group/:groupId/closed` | Closed boards |
| GET | `/api/boards/group/:groupId/admin-board` | Admin overview board |
| GET | `/api/boards/:id/admin-overview` | Cross-board article buckets |
| POST | `/api/boards` | Create board |
| GET | `/api/boards/:id` | Get board |
| PATCH | `/api/boards/:id` | Rename board |
| POST | `/api/boards/:id/members` | Add member |
| DELETE | `/api/boards/:id/members/:userId` | Remove member |
| PATCH | `/api/boards/:id/members/:userId/role` | Update member role |
| PATCH | `/api/boards/:id/close` | Close board |
| PATCH | `/api/boards/:id/reopen` | Reopen board |

### Lists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lists/board/:boardId` | Get board lists |
| POST | `/api/lists` | Create list |
| PATCH | `/api/lists/:id` | Rename list |
| PATCH | `/api/lists/:id/archive` | Archive list |
| PATCH | `/api/lists/:id/unarchive` | Restore list |
| DELETE | `/api/lists/:id` | Delete list |

### Articles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/articles` | Create article |
| GET | `/api/articles/list/:listId` | List articles |
| GET | `/api/articles/:id` | Get article |
| PATCH | `/api/articles/:id` | Update title/body |
| PATCH | `/api/articles/:id/status` | Update status |
| PATCH | `/api/articles/:id/move` | Move between lists |
| DELETE | `/api/articles/:id` | Delete article |

### Review
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/review/pick` | Create review copy |
| PATCH | `/api/review/copy/:id/status` | Update copy status and sync to original |
| DELETE | `/api/review/copy/:id` | Delete copy and unlock original |
| GET | `/api/review/boards` | Available boards for review |

### Comments, Activity & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/:articleId` | Get comments |
| POST | `/api/comments` | Create comment or reply |
| PATCH | `/api/comments/:id` | Edit comment |
| DELETE | `/api/comments/:id` | Delete comment |
| GET | `/api/activity/:articleId` | Article activity history |
| GET | `/api/notifications` | Notifications and unread count |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
