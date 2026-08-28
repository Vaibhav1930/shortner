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

Frontend on Vercel:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-api.example.com`

Backend and database on Render:

- `render.yaml` defines a PostgreSQL database and web service.
- Set `JWT_SECRET`, `CLIENT_ORIGIN`, and `APP_BASE_URL` in Render.
- `CLIENT_ORIGIN` should be your Vercel app URL.
- `APP_BASE_URL` should be your Render API URL, because public short links live on the backend.

Railway is also suitable: deploy `backend`, attach a PostgreSQL database, run `npm run prisma:deploy` during deploy, and set the same environment variables.

## Deployed Links

- Frontend: _add Vercel URL after deployment_
- Backend: _add Render or Railway URL after deployment_

## Build Checks

```bash
npm --prefix backend run build
npm --prefix frontend run build
```
