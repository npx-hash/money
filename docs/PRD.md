# Product Requirements Document (PRD)

## Goal
Launch a brokered dropshipping store in 14 days that preserves unit economics and targets $5-$10+ net profit per sale.

## Roles
- Merchant (you): owns branding, pricing, demand generation.
- Suppliers: fulfill goods and provide tracking.
- Platform: routes orders, enforces margins, monitors operations.

## MVP Scope
### Storefront
- Landing page
- Collections page
- Product detail pages
- Cart
- Stripe checkout

### Backend
- Order creation
- Supplier routing
- Tracking sync automation
- Refund recording/processing
- Webhook handling (Stripe)

### Admin
- Profit dashboard
- Supplier editor
- Price controls
- Product kill-switch

### Automation
- Order to supplier API handoff
- Tracking to customer email updates
- Low-stock alert sweep

## Monetization Rules
- Margin floor: 30% enforced at price updates and checkout eligibility.
- Loss prevention: products with <= $0 margin blocked from sale.
- Auto pricing tests: safe variants only, no variant below margin floor.

## Non-Goals (v1)
- Multi-currency support
- Marketplace connectors (Amazon/eBay)
- Advanced anti-fraud workflows

## Success Metrics (first 14 days)
- Checkout live and webhook-confirmed orders
- At least one routed order with tracking email sent
- 30%+ gross margin preserved across all active SKUs
