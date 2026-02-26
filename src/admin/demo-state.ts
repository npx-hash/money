import { demoCatalog } from "@/products/demo-catalog";
import { evaluateMargin, suggestPriceVariants } from "@/products/pricing-engine";

export type DemoSupplier = {
  id: string;
  name: string;
  code: string;
  type: "ALIEXPRESS" | "US_WHOLESALER";
  isActive: boolean;
  contactEmail: string | null;
  averageLeadDays: number;
  shippingMaxDays: number;
};

type DemoProductState = {
  id: string;
  slug: string;
  name: string;
  salePrice: number;
  supplierCost: number;
  minMarginPct: number;
  autoPriceTest: boolean;
  isActive: boolean;
  inventory: number;
  lowStockThreshold: number;
  createdAt: Date;
};

type DemoPriceExperiment = {
  id: string;
  variant: string;
  testPrice: number;
  isActive: boolean;
};

const demoSuppliersState: DemoSupplier[] = [
  {
    id: "demo_supplier_us",
    name: "FastLane US Wholesale",
    code: "US_FASTLANE",
    type: "US_WHOLESALER",
    isActive: true,
    contactEmail: "routing@fastlane.example",
    averageLeadDays: 1,
    shippingMaxDays: 6,
  },
  {
    id: "demo_supplier_alix",
    name: "AliExpress Broker Feed",
    code: "ALIEXPRESS_MAIN",
    type: "ALIEXPRESS",
    isActive: true,
    contactEmail: "ops@aliexpress.example",
    averageLeadDays: 2,
    shippingMaxDays: 10,
  },
];

const demoProductsState: DemoProductState[] = demoCatalog.map((product, index) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  salePrice: product.salePrice,
  supplierCost: product.supplierCost,
  minMarginPct: product.minMarginPct,
  autoPriceTest: product.autoPriceTest,
  isActive: product.isActive,
  inventory: product.inventory,
  lowStockThreshold: Math.max(5, Math.floor(product.inventory * 0.1)),
  createdAt: new Date(Date.now() - index * 60_000),
}));

const demoExperimentsByProductId = new Map<string, DemoPriceExperiment[]>();

function findDemoProduct(productId: string): DemoProductState {
  const product = demoProductsState.find((entry) => entry.id === productId);
  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

export function listDemoSuppliers(): DemoSupplier[] {
  return demoSuppliersState.map((supplier) => ({ ...supplier }));
}

export function updateDemoSupplier(input: {
  id: string;
  isActive?: boolean;
  contactEmail?: string | null;
  averageLeadDays?: number;
  shippingMaxDays?: number;
}): DemoSupplier {
  const supplier = demoSuppliersState.find((entry) => entry.id === input.id);
  if (!supplier) {
    throw new Error("Supplier not found");
  }

  if (typeof input.isActive === "boolean") {
    supplier.isActive = input.isActive;
  }

  if (typeof input.contactEmail !== "undefined") {
    supplier.contactEmail = input.contactEmail;
  }

  if (typeof input.averageLeadDays === "number") {
    supplier.averageLeadDays = input.averageLeadDays;
  }

  if (typeof input.shippingMaxDays === "number") {
    supplier.shippingMaxDays = input.shippingMaxDays;
  }

  return { ...supplier };
}

export function listDemoPricingProducts() {
  return demoProductsState.map((product) => ({
    id: product.id,
    name: product.name,
    salePrice: product.salePrice,
    supplierCost: product.supplierCost,
    minMarginPct: product.minMarginPct,
    autoPriceTest: product.autoPriceTest,
  }));
}

export function updateDemoPricing(input: {
  productId: string;
  salePrice: number;
  autoPriceTest?: boolean;
}) {
  const product = findDemoProduct(input.productId);
  const margin = evaluateMargin({
    salePrice: input.salePrice,
    supplierCost: product.supplierCost,
    minMarginPct: product.minMarginPct,
  });

  if (!margin.valid) {
    throw new Error(margin.reason ?? "Invalid margin");
  }

  product.salePrice = input.salePrice;
  if (typeof input.autoPriceTest === "boolean") {
    product.autoPriceTest = input.autoPriceTest;
  }

  return {
    id: product.id,
    salePrice: product.salePrice,
    autoPriceTest: product.autoPriceTest,
  };
}

export function createDemoPriceExperiment(productId: string) {
  const product = findDemoProduct(productId);
  const variants = suggestPriceVariants(product.supplierCost, product.salePrice);
  if (variants.length < 2) {
    throw new Error("Not enough safe variants available");
  }

  const experiments = variants.map((price) => ({
    id: `demo_exp_${productId}_${price.toFixed(2).replace(".", "_")}`,
    variant: `variant_${price.toFixed(2).replace(".", "_")}`,
    testPrice: price,
    isActive: true,
  }));

  demoExperimentsByProductId.set(productId, experiments);
  return experiments.map((experiment) => ({ ...experiment }));
}

export function listDemoProductStatus() {
  return [...demoProductsState]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((product) => ({
      id: product.id,
      name: product.name,
      isActive: product.isActive,
      inventory: product.inventory,
      lowStockThreshold: product.lowStockThreshold,
    }));
}

export function toggleDemoProduct(productId: string, isActive: boolean) {
  const product = findDemoProduct(productId);
  product.isActive = isActive;
  return { id: product.id, isActive: product.isActive };
}

export function getDemoExperiments(productId: string) {
  return (demoExperimentsByProductId.get(productId) ?? []).map((experiment) => ({ ...experiment }));
}
