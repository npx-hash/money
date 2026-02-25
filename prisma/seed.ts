import { PrismaClient, ReturnRisk, SupplierType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const aliExpress = await prisma.supplier.upsert({
    where: { code: "ALIEXPRESS_MAIN" },
    update: {
      name: "AliExpress Broker Feed",
      type: SupplierType.ALIEXPRESS,
      isActive: true,
      averageLeadDays: 2,
      shippingMaxDays: 10,
      contactEmail: "ops@aliexpress.example",
    },
    create: {
      code: "ALIEXPRESS_MAIN",
      name: "AliExpress Broker Feed",
      type: SupplierType.ALIEXPRESS,
      isActive: true,
      averageLeadDays: 2,
      shippingMaxDays: 10,
      contactEmail: "ops@aliexpress.example",
    },
  });

  const usWholesaler = await prisma.supplier.upsert({
    where: { code: "US_FASTLANE" },
    update: {
      name: "FastLane US Wholesale",
      type: SupplierType.US_WHOLESALER,
      isActive: true,
      averageLeadDays: 1,
      shippingMaxDays: 6,
      contactEmail: "routing@fastlane.example",
    },
    create: {
      code: "US_FASTLANE",
      name: "FastLane US Wholesale",
      type: SupplierType.US_WHOLESALER,
      isActive: true,
      averageLeadDays: 1,
      shippingMaxDays: 6,
      contactEmail: "routing@fastlane.example",
    },
  });

  const products = [
    {
      slug: "portable-milk-frother-pro",
      name: "Portable Milk Frother Pro",
      description:
        "USB rechargeable frother for coffee and protein mixes. Compact, light, and low defect rate.",
      category: "Kitchen",
      imageUrl:
        "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80",
      supplierCost: 8.2,
      salePrice: 19.99,
      shippingDays: 7,
      inventory: 120,
      lowStockThreshold: 10,
      returnRisk: ReturnRisk.LOW,
    },
    {
      slug: "resistance-bands-home-gym-set",
      name: "Resistance Bands Home Gym Set",
      description:
        "5-band kit with door anchor and handles. Durable packaging and broad US demand.",
      category: "Fitness",
      imageUrl:
        "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
      supplierCost: 11.5,
      salePrice: 27.99,
      shippingDays: 6,
      inventory: 80,
      lowStockThreshold: 8,
      returnRisk: ReturnRisk.LOW,
    },
    {
      slug: "motion-sensor-closet-led-2pack",
      name: "Motion Sensor Closet LED (2-Pack)",
      description:
        "Battery LED bars with magnetic mount. Lightweight, simple SKU, and low breakage return profile.",
      category: "Home",
      imageUrl:
        "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=1200&q=80",
      supplierCost: 9.8,
      salePrice: 24.99,
      shippingDays: 5,
      inventory: 65,
      lowStockThreshold: 7,
      returnRisk: ReturnRisk.LOW,
    },
  ];

  for (const product of products) {
    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        category: product.category,
        imageUrl: product.imageUrl,
        supplierCost: product.supplierCost,
        salePrice: product.salePrice,
        shippingDays: product.shippingDays,
        inventory: product.inventory,
        lowStockThreshold: product.lowStockThreshold,
        returnRisk: product.returnRisk,
        isActive: true,
        autoPriceTest: true,
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        imageUrl: product.imageUrl,
        supplierCost: product.supplierCost,
        salePrice: product.salePrice,
        shippingDays: product.shippingDays,
        inventory: product.inventory,
        lowStockThreshold: product.lowStockThreshold,
        returnRisk: product.returnRisk,
        isActive: true,
        autoPriceTest: true,
      },
    });

    await prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: {
          supplierId: usWholesaler.id,
          productId: savedProduct.id,
        },
      },
      update: {
        supplierSku: `US-${savedProduct.slug}`,
        supplierPrice: Number(savedProduct.supplierCost),
        stock: savedProduct.inventory,
        isPreferred: true,
      },
      create: {
        supplierId: usWholesaler.id,
        productId: savedProduct.id,
        supplierSku: `US-${savedProduct.slug}`,
        supplierPrice: Number(savedProduct.supplierCost),
        stock: savedProduct.inventory,
        isPreferred: true,
      },
    });

    await prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: {
          supplierId: aliExpress.id,
          productId: savedProduct.id,
        },
      },
      update: {
        supplierSku: `ALIX-${savedProduct.slug}`,
        supplierPrice: Number(savedProduct.supplierCost) - 1,
        stock: Math.max(savedProduct.inventory - 20, 5),
        isPreferred: false,
      },
      create: {
        supplierId: aliExpress.id,
        productId: savedProduct.id,
        supplierSku: `ALIX-${savedProduct.slug}`,
        supplierPrice: Number(savedProduct.supplierCost) - 1,
        stock: Math.max(savedProduct.inventory - 20, 5),
        isPreferred: false,
      },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
