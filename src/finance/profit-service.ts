import { OrderStatus } from "@prisma/client";
import { db } from "@/core/db";

export async function getProfitSnapshot(days = 30) {
  if (!process.env.DATABASE_URL) {
    return {
      orderCount: 0,
      grossRevenue: 0,
      grossProfit: 0,
      avgProfit: 0,
      byStatus: {},
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: since },
        status: {
          not: OrderStatus.CANCELED,
        },
      },
      select: {
        id: true,
        total: true,
        profit: true,
        status: true,
        createdAt: true,
      },
    });

    const grossRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const grossProfit = orders.reduce((sum, order) => sum + Number(order.profit), 0);
    const avgProfit = orders.length ? grossProfit / orders.length : 0;

    const byStatus = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      orderCount: orders.length,
      grossRevenue,
      grossProfit,
      avgProfit,
      byStatus,
    };
  } catch {
    return {
      orderCount: 0,
      grossRevenue: 0,
      grossProfit: 0,
      avgProfit: 0,
      byStatus: {},
    };
  }
}

export async function getRecentOrders(limit = 20) {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    return await db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}
