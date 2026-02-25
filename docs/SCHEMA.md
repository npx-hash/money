# Schema Overview

Prisma schema is defined in `prisma/schema.prisma`.

## Core Entities
- `Supplier`: fulfillment partners (AliExpress + US wholesaler).
- `Product`: catalog entries with cost, price, margin floor, inventory.
- `SupplierProduct`: supplier SKU mapping and stock data.
- `Order`: customer order with status, totals, profit, tracking.
- `OrderItem`: line-level cost/price/profit tracking.
- `TrackingEvent`: shipping lifecycle updates.
- `Refund`: recorded refund events.
- `LowStockAlert`: sent alert history.
- `PriceExperiment`: auto price test variants.
- `AutomationLog`: automation audit log.

## Status Lifecycles
- Orders: `PENDING -> ROUTED -> SHIPPED -> DELIVERED`
- Refund path: `* -> REFUNDED`

## Margin Protection
- Product stores `supplierCost`, `salePrice`, and `minMarginPct`.
- Margin validation runs before pricing updates and checkout item resolution.
