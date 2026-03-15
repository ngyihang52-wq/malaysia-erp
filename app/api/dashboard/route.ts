import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function GET() {
  try {
    // Aggregate stats
    const [
      orderAgg,
      productCount,
      lowStockCount,
      customerCount,
      recentOrders,
      platformStats,
      integrations,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.inventoryItem.count({
        where: { quantity: { lte: prisma.inventoryItem.fields.reorderPoint } },
      }).catch(() => 0),
      prisma.customer.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: { select: { name: true } },
          integration: { select: { platform: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["integrationId"],
        _sum: { total: true },
        _count: true,
      }),
      prisma.platformIntegration.findMany({
        where: { isActive: true },
        select: { id: true, platform: true },
      }),
    ]);

    // Build platform map
    const integrationMap = new Map(integrations.map((i) => [i.id, i.platform]));

    const platformSummary = ["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"].map((p) => {
      const stats = platformStats.find((s) => integrationMap.get(s.integrationId || "") === p);
      const isConnected = integrations.some((i) => i.platform === p);
      return {
        name: p,
        orders: stats?._count || 0,
        revenue: Number(stats?._sum?.total || 0),
        status: isConnected ? "active" : "disconnected",
      };
    });

    const mappedRecentOrders = recentOrders.map((o) => ({
      id: o.orderNumber,
      platform: o.integration?.platform || "DIRECT",
      customer: o.customer?.name || "Unknown",
      total: Number(o.total),
      status: o.status,
      time: o.placedAt?.toISOString() || o.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue: Number(orderAgg._sum.total || 0),
          totalOrders: orderAgg._count || 0,
          activeProducts: productCount,
          lowStockAlerts: typeof lowStockCount === "number" ? lowStockCount : 0,
          newCustomers: customerCount,
        },
        platforms: platformSummary,
        recentOrders: mappedRecentOrders,
        lowStockItems: [],
      },
    });
  } catch (error) {
    return apiError(`Failed to load dashboard: ${(error as Error).message}`, 500);
  }
}
