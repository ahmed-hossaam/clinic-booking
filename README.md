# Clinic Appointment Booking System

Full-stack MVP for patient appointment booking with admin management.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, TypeScript, PostgreSQL, Drizzle ORM, Zod, JWT (HTTP-only cookies), bcrypt

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local, Docker, Neon, etc.)

## Setup

### 1. Database

Create a PostgreSQL database, for example:

```sql
CREATE DATABASE clinic_booking;
```

Or with Docker:

```bash
docker run --name clinic-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=clinic_booking -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, and optional clinic hours / timezone
npm install
npm run db:migrate
npm run seed:doctors
npm run seed:admin
npm run dev
```

API runs at **http://localhost:3001**.

### 3. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:5173**.

## Default admin (from seed)

After `npm run seed:admin`, sign in with values from `server/.env`:

- `ADMIN_EMAIL` (default `admin@clinic.local`)
- `ADMIN_PASSWORD` (default in `.env.example` — change before seeding in production)

Public signup always creates **patient** accounts only.

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| server | `npm run dev` | API with hot reload |
| server | `npm run build` / `npm start` | Production API |
| server | `npm run db:migrate` | Apply Drizzle migrations |
| server | `npm run seed:doctors` | Seed doctor list |
| server | `npm run seed:admin` | Create admin user |
| client | `npm run dev` | Vite dev server |
| client | `npm run build` | Production static build |

## Deployment notes

- **Frontend (Vercel):** Set `VITE_API_URL` to your API origin. Enable credentials-compatible CORS on the API.
- **Backend (Render):** Set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`.
- **PostgreSQL:** Neon or any PostgreSQL provider compatible with Drizzle migrations.

Ensure production cookies use `secure` + `sameSite: none` (already configured when `NODE_ENV=production`).

## API overview

- `POST /api/auth/signup` — patient registration
- `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me`
- `GET /api/doctors` — optional `?specialty=`
- `GET /api/doctors/:id/availability`
- `GET /api/appointments/mine` — patient
- `POST /api/appointments` — book slot
- `POST /api/appointments/:id/cancel` — patient
- `GET /api/admin/appointments` — optional `?status=`
- `POST /api/admin/appointments/:id/confirm|cancel`

Active slots are enforced with a partial unique index on `(doctor_id, slot)` where status is `pending` or `confirmed`.
