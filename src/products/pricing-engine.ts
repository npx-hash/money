import { MIN_MARGIN_PCT } from "@/core/constants";
import { calculateMarginDollars, calculateMarginPct, roundCurrency } from "@/core/money";

export type MarginGuardInput = {
  salePrice: number;
  supplierCost: number;
  minMarginPct?: number;
};

export type MarginGuardResult = {
  marginPct: number;
  marginDollars: number;
  valid: boolean;
  reason?: string;
};

export function evaluateMargin({
  salePrice,
  supplierCost,
  minMarginPct = MIN_MARGIN_PCT,
}: MarginGuardInput): MarginGuardResult {
  const marginDollars = calculateMarginDollars(salePrice, supplierCost);
  const marginPct = calculateMarginPct(salePrice, supplierCost);

  if (marginDollars <= 0) {
    return {
      marginDollars,
      marginPct,
      valid: false,
      reason: "Loss-making product blocked",
    };
  }

  if (marginPct < minMarginPct) {
    return {
      marginDollars,
      marginPct,
      valid: false,
      reason: `Margin ${marginPct}% is below required ${minMarginPct}%`,
    };
  }

  return {
    marginDollars,
    marginPct,
    valid: true,
  };
}

export function suggestPriceVariants(cost: number, basePrice: number): number[] {
  const floorByMargin = roundCurrency(cost / (1 - MIN_MARGIN_PCT / 100));
  const floorPrice = Math.max(floorByMargin, basePrice * 0.95);

  const variants = [
    roundCurrency(basePrice),
    roundCurrency(basePrice * 1.04),
    roundCurrency(basePrice * 1.08),
  ];

  return variants.filter((price) => price >= floorPrice);
}

export function chooseVariantPrice(visitorSeed: string, variants: number[]): number {
  if (variants.length === 0) {
    throw new Error("No variants available");
  }

  const hash = Array.from(visitorSeed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
}
