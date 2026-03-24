import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { aj } from "@/lib/arcjet";

function periodToDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
    case "30d":
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(request: NextRequest) {
  const decision = await aj.protect(request);
  if (decision.isDenied()) return apiError("Request blocked", 403);

  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);

  const { orgId } = auth;
  const url = new URL(request.url);
  const metric = url.searchParams.get("metric") || "";
  const period = url.searchParams.get("period") || "30d";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 100);

  const since = periodToDate(period);

  try {
    switch (metric) {
      case "revenue-trend": {
        const rows = await prisma.$queryRaw<
          { date: Date; revenue: number; orders: bigint }[]
        >`
          SELECT DATE("createdAt") as date, SUM(total) as revenue, COUNT(*) as orders
          FROM "Order"
          WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `;

        const data = rows.map((r) => ({
          date: r.date.toISOString().split("T")[0],
          revenue: Number(r.revenue),
          orders: Number(r.orders),
        }));

        return NextResponse.json({ success: true, data });
      }

      case "order-trend": {
        const rows = await prisma.$queryRaw<
          { date: Date; count: bigint }[]
        >`
          SELECT DATE("createdAt") as date, COUNT(*) as count
          FROM "Order"
          WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `;

        const data = rows.map((r) => ({
          date: r.date.toISOString().split("T")[0],
          count: Number(r.count),
        }));

        return NextResponse.json({ success: true, data });
      }

      case "order-status": {
        const results = await prisma.order.groupBy({
          by: ["status"],
          where: { orgId },
          _count: { _all: true },
        });

        const data = results.map((s) => ({
          status: s.status,
          count: s._count._all,
        }));

        return NextResponse.json({ success: true, data });
      }

      case "aov": {
        const overall = await prisma.$queryRaw<
          { total_orders: bigint; total_revenue: number; aov: number }[]
        >`
          SELECT
            COUNT(*) as total_orders,
            COALESCE(SUM(total), 0) as total_revenue,
            CASE WHEN COUNT(*) > 0 THEN SUM(total) / COUNT(*) ELSE 0 END as aov
          FROM "Order"
          WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}
        `;

        const byPlatformRows = await prisma.$queryRaw<
          { platform: string; orders: bigint; revenue: number; aov: number }[]
        >`
          SELECT
            pi.platform,
            COUNT(*) as orders,
            COALESCE(SUM(o.total), 0) as revenue,
            CASE WHEN COUNT(*) > 0 THEN SUM(o.total) / COUNT(*) ELSE 0 END as aov
          FROM "Order" o
          JOIN "PlatformIntegration" pi ON o."integrationId" = pi.id
          WHERE o."orgId" = ${orgId} AND o."createdAt" >= ${since}
          GROUP BY pi.platform
          ORDER BY revenue DESC
        `;

        const overallRow = overall[0];
        const data = {
          overall: {
            orders: Number(overallRow.total_orders),
            revenue: Number(overallRow.total_revenue),
            aov: Number(overallRow.aov),
          },
          byPlatform: byPlatformRows.map((r) => ({
            platform: r.platform,
            orders: Number(r.orders),
            revenue: Number(r.revenue),
            aov: Number(r.aov),
          })),
        };

        return NextResponse.json({ success: true, data });
      }

      case "top-products": {
        const rows = await prisma.$queryRaw<
          { name: string; sku: string; units_sold: bigint; revenue: number }[]
        >`
          SELECT p.name, p.sku, SUM(oi.quantity) as units_sold, SUM(oi.total) as revenue
          FROM "OrderItem" oi
          JOIN "ProductVariant" pv ON oi."variantId" = pv.id
          JOIN "Product" p ON pv."productId" = p.id
          JOIN "Order" o ON oi."orderId" = o.id
          WHERE o."orgId" = ${orgId} AND o."createdAt" >= ${since}
          GROUP BY p.id, p.name, p.sku
          ORDER BY units_sold DESC
          LIMIT ${limit}
        `;

        const data = rows.map((r) => ({
          name: r.name,
          sku: r.sku,
          unitsSold: Number(r.units_sold),
          revenue: Number(r.revenue),
        }));

        return NextResponse.json({ success: true, data });
      }

      case "top-customers": {
        const customers = await prisma.customer.findMany({
          where: { orgId },
          orderBy: { totalSpent: "desc" },
          take: limit,
          select: {
            name: true,
            email: true,
            totalOrders: true,
            totalSpent: true,
            platform: true,
          },
        });

        const data = customers.map((c) => {
          const spent = Number(c.totalSpent);
          let tier: string;
          if (spent > 3000) tier = "VIP";
          else if (spent > 1500) tier = "Gold";
          else if (spent > 500) tier = "Silver";
          else tier = "Bronze";

          return {
            name: c.name,
            email: c.email,
            totalOrders: c.totalOrders,
            totalSpent: spent,
            platform: c.platform,
            tier,
          };
        });

        return NextResponse.json({ success: true, data });
      }

      case "customer-tiers": {
        const rows = await prisma.$queryRaw<
          { tier: string; count: bigint }[]
        >`
          SELECT
            CASE
              WHEN "totalSpent" > 3000 THEN 'VIP'
              WHEN "totalSpent" > 1500 THEN 'Gold'
              WHEN "totalSpent" > 500 THEN 'Silver'
              ELSE 'Bronze'
            END as tier,
            COUNT(*) as count
          FROM "Customer"
          WHERE "orgId" = ${orgId}
          GROUP BY tier
          ORDER BY count DESC
        `;

        const data = rows.map((r) => ({
          tier: r.tier,
          count: Number(r.count),
        }));

        return NextResponse.json({ success: true, data });
      }

      case "repeat-rate": {
        const rows = await prisma.$queryRaw<
          { total_customers: bigint; repeat_customers: bigint }[]
        >`
          SELECT
            COUNT(*) as total_customers,
            COUNT(CASE WHEN "totalOrders" >= 2 THEN 1 END) as repeat_customers
          FROM "Customer"
          WHERE "orgId" = ${orgId}
        `;

        const row = rows[0];
        const totalCustomers = Number(row.total_customers);
        const repeatCustomers = Number(row.repeat_customers);
        const repeatRate =
          totalCustomers > 0
            ? Math.round((repeatCustomers / totalCustomers) * 10000) / 100
            : 0;

        return NextResponse.json({
          success: true,
          data: { totalCustomers, repeatCustomers, repeatRate },
        });
      }

      case "return-rate": {
        const rows = await prisma.$queryRaw<
          { total_orders: bigint; returned_orders: bigint }[]
        >`
          SELECT
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status IN ('CANCELLED', 'RETURNED', 'REFUNDED') THEN 1 END) as returned_orders
          FROM "Order"
          WHERE "orgId" = ${orgId} AND "createdAt" >= ${since}
        `;

        const row = rows[0];
        const totalOrders = Number(row.total_orders);
        const returnedOrders = Number(row.returned_orders);
        const returnRate =
          totalOrders > 0
            ? Math.round((returnedOrders / totalOrders) * 10000) / 100
            : 0;

        return NextResponse.json({
          success: true,
          data: { totalOrders, returnedOrders, returnRate },
        });
      }

      case "sales-heatmap": {
        const since90d = new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000
        );

        const rows = await prisma.$queryRaw<
          { date: Date; count: bigint }[]
        >`
          SELECT DATE("createdAt") as date, COUNT(*) as count
          FROM "Order"
          WHERE "orgId" = ${orgId} AND "createdAt" >= ${since90d}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `;

        const data = rows.map((r) => ({
          date: r.date.toISOString().split("T")[0],
          count: Number(r.count),
        }));

        return NextResponse.json({ success: true, data });
      }

      case "profit-margins": {
        const marginLimit = Math.min(
          parseInt(url.searchParams.get("limit") || "20"),
          100
        );

        const rows = await prisma.$queryRaw<
          {
            name: string;
            sku: string;
            costPrice: number;
            avg_selling_price: number;
            margin_pct: number;
          }[]
        >`
          SELECT p.name, p.sku, p."costPrice",
            COALESCE(AVG(cp."sellingPrice"), 0) as avg_selling_price,
            CASE WHEN AVG(cp."sellingPrice") > 0
              THEN ((AVG(cp."sellingPrice") - p."costPrice") / AVG(cp."sellingPrice")) * 100
              ELSE 0 END as margin_pct
          FROM "Product" p
          LEFT JOIN "ChannelProduct" cp ON cp."productId" = p.id
          WHERE p."orgId" = ${orgId} AND p."isActive" = true
          GROUP BY p.id, p.name, p.sku, p."costPrice"
          ORDER BY margin_pct ASC
          LIMIT ${marginLimit}
        `;

        const data = rows.map((r) => ({
          name: r.name,
          sku: r.sku,
          costPrice: Number(r.costPrice),
          avgSellingPrice: Number(r.avg_selling_price),
          marginPct: Number(r.margin_pct),
        }));

        return NextResponse.json({ success: true, data });
      }

      case "inventory-turnover": {
        const turnoverLimit = Math.min(
          parseInt(url.searchParams.get("limit") || "20"),
          100
        );

        const rows = await prisma.$queryRaw<
          {
            name: string;
            sku: string;
            current_stock: number;
            units_sold: number;
            turnover_rate: number;
          }[]
        >`
          SELECT p.name, p.sku,
            COALESCE(SUM(ii.quantity), 0) as current_stock,
            COALESCE(sold.units_sold, 0) as units_sold,
            CASE WHEN SUM(ii.quantity) > 0
              THEN COALESCE(sold.units_sold, 0)::float / SUM(ii.quantity)
              ELSE 0 END as turnover_rate
          FROM "Product" p
          LEFT JOIN "InventoryItem" ii ON ii."productId" = p.id
          LEFT JOIN (
            SELECT pv."productId", SUM(oi.quantity) as units_sold
            FROM "OrderItem" oi
            JOIN "ProductVariant" pv ON oi."variantId" = pv.id
            JOIN "Order" o ON oi."orderId" = o.id
            WHERE o."createdAt" >= ${since} AND o."orgId" = ${orgId}
            GROUP BY pv."productId"
          ) sold ON sold."productId" = p.id
          WHERE p."orgId" = ${orgId} AND p."isActive" = true
          GROUP BY p.id, p.name, p.sku, sold.units_sold
          ORDER BY turnover_rate DESC
          LIMIT ${turnoverLimit}
        `;

        const data = rows.map((r) => ({
          name: r.name,
          sku: r.sku,
          currentStock: Number(r.current_stock),
          unitsSold: Number(r.units_sold),
          turnoverRate: Number(r.turnover_rate),
        }));

        return NextResponse.json({ success: true, data });
      }

      case "low-stock": {
        const rows = await prisma.$queryRaw<
          {
            name: string;
            sku: string;
            quantity: number;
            reorderPoint: number;
            reorderQty: number;
            warehouse: string;
          }[]
        >`
          SELECT p.name, p.sku, ii.quantity, ii."reorderPoint", ii."reorderQty", w.name as warehouse
          FROM "InventoryItem" ii
          JOIN "Product" p ON ii."productId" = p.id
          JOIN "Warehouse" w ON ii."warehouseId" = w.id
          WHERE w."orgId" = ${orgId} AND ii.quantity <= ii."reorderPoint"
          ORDER BY (ii.quantity::float / GREATEST(ii."reorderPoint", 1)) ASC
        `;

        const data = rows.map((r) => ({
          name: r.name,
          sku: r.sku,
          quantity: Number(r.quantity),
          reorderPoint: Number(r.reorderPoint),
          reorderQty: Number(r.reorderQty),
          warehouse: r.warehouse,
        }));

        return NextResponse.json({ success: true, data });
      }

      case "sync-health": {
        const integrations = await prisma.platformIntegration.findMany({
          where: { orgId },
          select: {
            id: true,
            platform: true,
            isActive: true,
            lastSyncAt: true,
          },
        });

        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const logs = await prisma.syncLog.findMany({
          where: {
            integrationId: { in: integrations.map((i) => i.id) },
            startedAt: { gte: since24h },
          },
          select: {
            integrationId: true,
            status: true,
            type: true,
            completedAt: true,
          },
        });

        const logsByIntegration = new Map<
          string,
          { success: number; failed: number; running: number }
        >();

        for (const log of logs) {
          const entry = logsByIntegration.get(log.integrationId) || {
            success: 0,
            failed: 0,
            running: 0,
          };

          if (log.status === "SUCCESS" || (log.status as string) === "COMPLETED") {
            entry.success++;
          } else if (log.status === "FAILED" || (log.status as string) === "ERROR") {
            entry.failed++;
          } else {
            entry.running++;
          }

          logsByIntegration.set(log.integrationId, entry);
        }

        const data = integrations.map((i) => ({
          platform: i.platform,
          isActive: i.isActive,
          lastSyncAt: i.lastSyncAt,
          syncs24h: logsByIntegration.get(i.id) || {
            success: 0,
            failed: 0,
            running: 0,
          },
        }));

        return NextResponse.json({ success: true, data });
      }

      case "activity-feed": {
        const feedLimit = Math.min(
          parseInt(url.searchParams.get("limit") || "20"),
          100
        );

        const [recentOrders, recentSyncs, recentActivities] =
          await Promise.all([
            prisma.order.findMany({
              where: { orgId },
              orderBy: { createdAt: "desc" },
              take: 20,
              select: {
                orderNumber: true,
                integration: { select: { platform: true } },
                createdAt: true,
              },
            }),
            prisma.syncLog.findMany({
              where: {
                integration: { orgId },
              },
              orderBy: { startedAt: "desc" },
              take: 20,
              select: {
                type: true,
                status: true,
                recordsCount: true,
                integration: { select: { platform: true } },
                startedAt: true,
              },
            }),
            prisma.activityLog.findMany({
              where: { user: { orgId } },
              orderBy: { createdAt: "desc" },
              take: 20,
              select: {
                action: true,
                details: true,
                user: { select: { name: true } },
                createdAt: true,
              },
            }),
          ]);

        const feed: { type: string; message: string; time: Date }[] = [];

        for (const o of recentOrders) {
          feed.push({
            type: "order",
            message: `New order #${o.orderNumber} from ${o.integration?.platform ?? "DIRECT"}`,
            time: o.createdAt,
          });
        }

        for (const s of recentSyncs) {
          feed.push({
            type: "sync",
            message: `Synced ${s.recordsCount ?? 0} ${s.type?.toLowerCase() ?? "records"} from ${s.integration.platform} (${s.status})`,
            time: s.startedAt,
          });
        }

        for (const a of recentActivities) {
          feed.push({
            type: "activity",
            message: `${a.user?.name ?? "System"} ${a.action}${a.details ? `: ${JSON.stringify(a.details)}` : ""}`,
            time: a.createdAt,
          });
        }

        feed.sort((a, b) => b.time.getTime() - a.time.getTime());

        const data = feed.slice(0, feedLimit);

        return NextResponse.json({ success: true, data });
      }

      default:
        return apiError(`Unknown metric: ${metric}`, 400);
    }
  } catch (error) {
    return apiError(
      `Analytics error: ${(error as Error).message}`,
      500
    );
  }
}
