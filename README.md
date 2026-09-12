# Whiteboard Sharing Application

A collaborative whiteboard app for creating rooms, inviting teammates, and drawing together in real time.

## Features

- Real-time room-based drawing with Socket.IO
- Pencil, line, and rectangle tools
- Per-room participant colors
- Persisted drawing history through Supabase
- Frontend form validation for room creation and joining
- Backend validation for drawing payloads before persistence

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Rough.js, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, Supabase
- Testing: Vitest for frontend utilities, Jest for backend utilities

## Setup

### Prerequisites

- Node.js 18 or newer
- npm
- Optional: a Supabase project with `rooms` and `drawings` tables for persisted drawing history

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend environment variables:

```env
CLIENT_ORIGINS=http://localhost:5173
PORT=5000
DB_URL=
DB_SECRET=
DB_ANON_PUBLIC=
```

`CLIENT_ORIGINS` accepts a comma-separated list of browser origins allowed to connect through HTTP and Socket.IO.
When `DB_URL` and `DB_SECRET` are blank, the backend runs local rooms in memory so the app can be reviewed without a Supabase account. Add Supabase credentials only when you want persisted room history.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend environment variables:

```env
VITE_BACKEND_URL=http://localhost:5000
```

## Quality Checks

Run backend checks:

```bash
cd backend
npm test
npm run smoke
```

Run frontend checks:

```bash
cd frontend
npm test
npm run lint
npm run build
```

## Deployment Notes

- Keep `.env` files out of git. Use the checked-in `.env.example` files as templates.
- Configure `CLIENT_ORIGINS` to include the deployed frontend origin.
- Configure `VITE_BACKEND_URL` to point at the deployed backend URL.
- Store Supabase keys only in the deployment provider's environment variable settings.
