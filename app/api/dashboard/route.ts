import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { aj } from "@/lib/arcjet";

export async function GET(request: NextRequest) {
  const decision = await aj.protect(request);
  if (decision.isDenied()) return apiError("Request blocked", 403);

  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);

  const { orgId } = auth;

  try {
    const [
      orderAgg, productCount, customerCount,
      recentOrders, platformStats, integrations,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { orgId }, _sum: { total: true }, _count: true }),
      prisma.product.count({ where: { isActive: true, orgId } }),
      prisma.customer.count({ where: { orgId } }),
      prisma.order.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: { select: { name: true } },
          integration: { select: { platform: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["integrationId"],
        where: { orgId },
        _sum: { total: true },
        _count: { _all: true },
      }).catch(() => []),
      prisma.platformIntegration.findMany({
        where: { isActive: true, orgId },
        select: { id: true, platform: true },
      }),
    ]);

    // Count low-stock items using raw SQL (avoids column-reference limitations)
    const lowStockResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM "InventoryItem" ii
      JOIN "Warehouse" w ON ii."warehouseId" = w.id
      WHERE w."orgId" = ${orgId}
        AND ii.quantity <= ii."reorderPoint"
    `.catch(() => [{ count: BigInt(0) }]);
    const lowStockCount = Number((lowStockResult as [{ count: bigint }])[0]?.count ?? 0);

    const integrationMap = new Map(integrations.map((i) => [i.id, i.platform]));
    const platformSummary = ["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"].map((p) => {
      const stats = platformStats.find((s) => integrationMap.get(s.integrationId || "") === p);
      const isConnected = integrations.some((i) => i.platform === p);
      return {
        name: p,
        orders: stats?._count?._all || 0,
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
