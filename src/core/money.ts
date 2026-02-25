import { ORDER_NUMBER_PREFIX } from "@/core/constants";

export function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateMarginDollars(salePrice: number, cost: number): number {
  return roundCurrency(salePrice - cost);
}

export function calculateMarginPct(salePrice: number, cost: number): number {
  if (salePrice <= 0) {
    return 0;
  }

  return roundCurrency(((salePrice - cost) / salePrice) * 100);
}

export function generateOrderNumber(now = new Date()): string {
  const stamp = now.toISOString().replace(/[\D]/g, "").slice(2, 14);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${ORDER_NUMBER_PREFIX}-${stamp}-${random}`;
}

export function dollarsFromCents(cents: number): number {
  return roundCurrency(cents / 100);
}
