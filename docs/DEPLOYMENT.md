# Deployment Guide

## 1) Infrastructure
- Host web app: Vercel (recommended) or any Node.js host.
- Host database: managed Postgres (Neon, Supabase, RDS, Railway).
- Optional queue/cron: Vercel Cron for tracking/low-stock endpoints.

## 2) Environment Variables
Use `.env.example` as template and configure:
- `DATABASE_URL`
- `NEXT_PUBLIC_BASE_URL`
- Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`)
- SMTP credentials
- Supplier API credentials

## 3) Database setup
- `npm run prisma:generate`
- `npm run prisma:push` (or `npm run prisma:migrate` in persistent env)
- `npm run prisma:seed`

## 4) Stripe webhook
- Endpoint: `/api/webhooks/stripe`
- Events to send:
  - `checkout.session.completed`
  - `charge.refunded`

## 5) Scheduled jobs (recommended)
- POST `/api/automation/tracking-sync` every 2-4 hours
- POST `/api/automation/low-stock` every 6-12 hours

## 6) Go-live checks
- Test checkout success and webhook order creation
- Confirm supplier routing status changes to `ROUTED`
- Confirm tracking sync sends email updates
- Validate kill-switch disables product on storefront
