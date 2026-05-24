# Expense Tracker Pro Backend

Production-ready NestJS API for Expense Tracker Pro with JWT authentication, Prisma ORM, PostgreSQL, Swagger documentation, analytics, budgets, and tested CRUD workflows.

## Stack

- NestJS 11
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT auth with Passport
- Swagger
- Jest unit tests
- Jest e2e tests

## Modules

- `auth`
- `users`
- `transactions`
- `categories`
- `budgets`
- `analytics`

## Core Features

- Register and login with hashed passwords
- JWT protected routes
- User profile updates
- Default category provisioning for each user
- Transaction CRUD with filtering, search, pagination, and CSV export
- Budget CRUD with per-category monthly tracking
- Dashboard analytics and monthly trends
- Swagger documentation for all routes
- Validation pipes and consistent exception formatting

## Environment Variables

Create `.env` from `.env.example`.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_tracker_pro?schema=public"
JWT_SECRET="replace-with-a-strong-secret"
FRONTEND_URL="http://localhost:3000"
PORT=4000
DEMO_EMAIL="demo@expensetracker.pro"
DEMO_PASSWORD="Passw0rd!2026"
```

## Local Setup

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run start:dev
```

The API runs on [http://localhost:4000](http://localhost:4000).

## Swagger

- Local docs URL: `http://localhost:4000/docs`

## Demo Credentials

- Email: `demo@expensetracker.pro`
- Password: `Passw0rd!2026`

## API Usage

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Users

- `GET /api/users/me`
- `PATCH /api/users/me`

### Categories

- `GET /api/categories`

### Transactions

- `POST /api/transactions`
- `GET /api/transactions`
- `GET /api/transactions/export/csv`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Budgets

- `POST /api/budgets`
- `GET /api/budgets`
- `PATCH /api/budgets/:id`
- `DELETE /api/budgets/:id`

### Analytics

- `GET /api/analytics/overview`
- `GET /api/analytics/category-breakdown`
- `GET /api/analytics/monthly-trends`

## Deployment to Render

1. Create a PostgreSQL database on Neon or Supabase.
2. Create a new Render Web Service from the backend repository.
3. Set the root directory to the backend project.
4. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `PORT=4000`
   - `DEMO_EMAIL`
   - `DEMO_PASSWORD`
5. Use the commands defined in `render.yaml`.
6. After deploy, verify:
   - `/api/health`
   - `/docs`
   - auth routes
   - transaction CRUD

## Screenshots

- Swagger docs
- Auth endpoints
- Transactions endpoints
- Analytics endpoints

## Quality Checks

- `npm run build` passes
- `npm run lint` passes
- `npm test -- --runInBand` passes
- `npm run test:e2e -- --runInBand` passes
