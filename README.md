# KasiPOS Backend

Backend API for **KasiPOS**, a modern offline‑first Point of Sale (POS) application for small businesses.

This service powers the business logic and cloud persistence for the frontend PWA (`kasiPOS-frontend`), which uses **Next.js**, **Dexie.js**, and **IndexedDB** for offline storage.

## How it fits with the frontend

- **Offline‑first:**  
  The frontend stores day‑to‑day data locally using IndexedDB/Dexie.js. When connectivity is available, it syncs data to this backend.
- **Domain mapping to features from the app:**
  - **POS & Transactions:** Persist completed sales, payment methods, refunds, and discounts so the frontend can show rich **transaction history** and analytics.
  - **Inventory Management:** Store products, categories, stock levels, and low‑stock thresholds that mirror the **Catalogue** and **Inventory** screens.
  - **Customer & Loyalty:** Hold customer profiles, loyalty balances, and redemption history for the **Customer Database** and loyalty program.
  - **Voucher Campaigns:** Serve and validate vouchers created in the **Voucher Management** module.
  - **Marketplace & BOPH:** Provide secure APIs for placing and tracking third‑party orders and pickup parcels (future modules).
  - **Reporting & Analytics:** Aggregate data for sales trends, top‑selling products, and payment breakdowns.
- **Security & Auth:**  
  Uses JWT‑based authentication (via `@nestjs/jwt` and `passport-jwt`) so only authenticated devices/users can sync and manage data.

---

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v12 or higher
- **npm** or **yarn**

---

## Installation

1. **Install dependencies**

```bash
cd kasiPOS-backend
npm install
```

2. **Create your environment file**

```bash
cp .env.example .env
```

3. **Configure environment variables**  
   Edit `.env` to match your local setup:

- **Database**
  - `DB_HOST=localhost`
  - `DB_PORT=5432`
  - `DB_USERNAME=postgres`
  - `DB_PASSWORD=postgres`
  - `DB_NAME=kasipos`
- **App**
  - `PORT=3000` (you can change this if it clashes with the frontend)
  - `NODE_ENV=development`
- **Auth**
  - `JWT_SECRET=your-secret-key`
  - `JWT_EXPIRES_IN=7d`
- **Optional integrations**
  - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`

---

## Database Setup

1. **Create the database**

```sql
CREATE DATABASE kasipos;
```

2. **Run migrations**

```bash
npm run migration:run
```

3. **(Optional) Seed initial data**

```bash
npm run seed:run
```

You can later clear seed data with:

```bash
npm run seed:clear
```

---

## Running the Backend (with the frontend)

### Start the backend

```bash
cd kasiPOS-backend
npm run start:dev
```

By default the API is available at:

- **Base URL:** `http://localhost:3000/api`
- **Healthcheck:** `GET /api/health`

You can change the port via the `PORT` env variable, for example `PORT=4000` if your Next.js frontend also runs on port 3000.

### Start the frontend (for a full stack dev setup)

In another terminal:

```bash
cd kasiPOS-frontend
npm install   # first time only
npm run dev
```

Then configure the frontend (e.g. via env) to point to the backend base URL, such as:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

This will let the PWA sync POS data, inventory, customers, vouchers, and reports against this backend.

---

## Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with watch
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run e2e tests
- `npm run migration:generate` - Generate a new migration (uses `src/database/data-source.ts`)
- `npm run migration:create` - Create an empty migration file
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration
- `npm run migration:show` - Show migration status

---

## Project Structure

```text
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── app.controller.ts       # Root controller (welcome + health)
├── app.service.ts          # Root service
├── database/               # Database configuration
│   ├── data-source.ts      # TypeORM data source (CLI + migrations)
│   ├── migrations/         # Database migrations
│   └── seed/               # Database seeds (run/clear)
└── [modules]/              # Feature modules (POS, inventory, customers, vouchers, etc.)
```

As you implement features that align with the frontend app, you can create modules like:

- `pos` (sales, cart, payments, refunds)
- `inventory` (products, stock levels, adjustments, alerts)
- `customers` (profiles, loyalty points, history)
- `vouchers` (campaigns, voucher issuance and redemption)
- `reports` (sales trends, top products, payment breakdowns)
- `marketplace` / `boph` (3rd‑party orders and pickups)

---

## Core Technologies

- **NestJS** – Progressive Node.js framework for building scalable server‑side apps
- **TypeORM** – ORM for PostgreSQL, migrations, and entity management
- **PostgreSQL** – Primary relational database
- **JWT + Passport** – Authentication and authorization
- **AWS S3 (optional)** – File and media storage

---

## License

UNLICENSED

