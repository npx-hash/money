# MarginMint - Brokered Dropshipping Platform MVP

Modular Next.js + TypeScript ecommerce platform built for a merchant-as-middleman model:
- You own pricing and margin.
- Suppliers fulfill orders.
- Platform enforces profitability and automates operations.

## Architecture
Domain modules live under `src/`:
- `src/core/` shared infrastructure and business primitives
- `src/suppliers/` supplier clients and routing logic
- `src/products/` product catalog and monetization engine
- `src/marketing/` launch checklist and growth workflows
- `src/finance/` profitability metrics
- `src/ai/` extension registry and autopilot hooks
- `src/admin/` admin domain services

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Postgres + Prisma ORM
- Stripe Checkout + webhooks
- SMTP email notifications

## Quick Start
1. Install deps:
```bash
npm install
```
2. Copy env template and fill values:
```bash
cp .env.example .env
```
3. Start Postgres (optional local docker):
```bash
docker compose up -d
```
4. Generate schema and seed demo data:
```bash
npm run setup
```
5. Start app:
```bash
npm run dev
```

Open `http://localhost:3000`.

## Key URLs
- Storefront landing: `/`
- Collections: `/collections`
- Cart: `/cart`
- Admin dashboard: `/admin`
- Orders admin: `/admin/orders`
- Automation admin: `/admin/automation`
- Supplier editor: `/admin/suppliers`
- Price controls: `/admin/pricing`
- Product kill-switch: `/admin/products`

## API Endpoints
- `POST /api/checkout` create Stripe checkout session (or simulated fallback)
- `POST /api/webhooks/stripe` Stripe webhook consumer
- `GET/POST /api/orders` order list + manual order creation
- `POST /api/orders/:id/refund` refund workflow
- `GET/PATCH /api/suppliers` supplier management
- `GET/POST/PATCH /api/pricing` pricing + experiments
- `POST /api/products/:id/kill-switch` product enable/disable
- `POST /api/automation/tracking-sync` tracking sync + customer email
- `POST /api/automation/low-stock` low-stock sweep

## Required Keys
Minimum for full production flow:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `ALIEXPRESS_*` and `US_WHOLESALER_*` supplier credentials

The app can still run in local simulation mode without Stripe/supplier keys.

## Docs
- [Step 0 Strategy](docs/STEP0_STRATEGY.md)
- [PRD](docs/PRD.md)
- [Schema](docs/SCHEMA.md)
- [Build Plan](docs/BUILD_PLAN.md)
- [Deployment](docs/DEPLOYMENT.md)
- [First Sale Playbook](docs/FIRST_SALE_PLAYBOOK.md)
