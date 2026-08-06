# Team Task Manager

Full-stack team task manager with:

- JWT auth
- Role-based access control
- Projects, tasks, comments, members
- Dashboard metrics and charts
- Responsive React UI
- Prisma-backed PostgreSQL schema

## Stack

- Frontend: React, Vite, React Router, Axios, React Hook Form, React Toastify, Chart.js
- Backend: Node.js, Express, JWT, bcrypt, Multer, Helmet, CORS, rate limiting
- Database: PostgreSQL with Prisma

## Project Structure

- `src/` - React frontend
- `server/` - Express API
- `prisma/` - database schema
- `docs/` - API and schema notes

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` to your PostgreSQL instance.

4. Apply Prisma schema:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the dev server:

```bash
npm run dev
```

## Deploying to Railway

- Deploy the backend as one Railway service
- Deploy the frontend as a separate Vite static service, or build and serve `dist`
- Use Railway PostgreSQL and set `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `CLIENT_URL`

## Deliverables

- API docs: `docs/api.md`
- Schema docs: `docs/schema.md`
