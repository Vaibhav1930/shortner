# URL Shortener with Click Analytics

A full-stack URL shortener with email/password auth, per-user links, public redirects, and timestamped click analytics.

## Architecture

- Vue 3 + TypeScript frontend sends credentialed requests to the Express API.
- Express validates input with Zod, authenticates users with a JWT stored in an httpOnly cookie, and reads/writes data through Prisma.
- PostgreSQL stores users, links, and click events.
- Public short links hit `GET /:shortCode`, create a click record, and redirect to the original URL with HTTP 302.

## Project Structure

```text
/backend
  /prisma/schema.prisma
  /src/controllers
  /src/middleware
  /src/routes
  /src/services
  /src/validators
  /src/server.ts
/frontend
  /src/api
  /src/router
  /src/schemas
  /src/stores
  /src/views
```

## Auth Token Choice

JWTs are stored in an httpOnly cookie named `accessToken`. This keeps the token unavailable to frontend JavaScript and works well with the API's credentialed CORS configuration. In production the cookie is sent with `SameSite=None; Secure` so a Vercel frontend can call a Render or Railway backend.

## Local Setup

Prerequisites:

- Node.js 24+
- PostgreSQL, or Docker for the included local PostgreSQL service

Install dependencies:

```bash
npm run install:all
```

Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

Update `backend/.env` with your PostgreSQL connection string and a long `JWT_SECRET`.

Optional local database with Docker:

```bash
docker compose up -d postgres
```

Create frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

Run the Prisma migration:

```bash
npm run prisma:migrate -- --name init
```

Start the API:

```bash
npm run dev:backend
```

Start the frontend in another terminal:

```bash
npm run dev:frontend
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create a user and set auth cookie |
| POST | `/api/auth/login` | No | Login and set auth cookie |
| POST | `/api/auth/logout` | No | Clear auth cookie |
| GET | `/api/auth/me` | Yes | Return current user |
| POST | `/api/links` | Yes | Create a short link from `{ originalUrl }` |
| GET | `/api/links` | Yes | List the authenticated user's links |
| GET | `/api/links/:id/stats` | Yes | Return link details and click history |
| GET | `/:shortCode` | No | Record a click and redirect to the original URL |

## Deployment

### Deploying Frontend and Backend on Render

When deploying the frontend as a Render **Static Site** and backend as a Render **Web Service**:

1. **Frontend Static Site Routing (Redirects / Rewrites)**:
   In your Render Dashboard for the frontend Static Site, open **Redirects/Rewrites** and configure these rules in order:
   - **Rule 1**: Source `/login` &rarr; Destination `/index.html` (Action: `Rewrite`)
   - **Rule 2**: Source `/register` &rarr; Destination `/index.html` (Action: `Rewrite`)
   - **Rule 3**: Source `/dashboard` &rarr; Destination `/index.html` (Action: `Rewrite`)
   - **Rule 4**: Source `/links/*` &rarr; Destination `/index.html` (Action: `Rewrite`)
   - **Rule 5**: Source `/api/*` &rarr; Destination `https://<your-backend-api>.onrender.com/api/*` (Action: `Rewrite`)
   - **Rule 6**: Source `/*` &rarr; Destination `https://<your-backend-api>.onrender.com/*` (Action: `Rewrite`)

   *Important*: Do not keep a catch-all `/* -> /index.html` rewrite, as it intercepts short codes and causes a blank page delay. Static assets (`/assets/*`) are served directly from disk automatically.

2. **Environment Variables**:
   - Backend:
     - `CLIENT_ORIGIN`: `https://your-frontend.onrender.com` (or custom domain)
     - `APP_BASE_URL`: `https://your-frontend.onrender.com` (or your short link domain)
     - `JWT_SECRET`: 32+ character random secret
     - `DATABASE_URL`: PostgreSQL connection string
   - Frontend:
     - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`

3. **Render Blueprint (`render.yaml`)**:
   `render.yaml` defines the database, backend web service, and frontend static site with the correct route rewrite rules already configured.

### Frontend on Vercel (Alternative)

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-api.example.com`
- `vercel.json` rewrites are restricted to SPA routes to prevent capturing short links.

## Build Checks

```bash
npm --prefix backend run build
npm --prefix frontend run build
```
