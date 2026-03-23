/**
 * Auto-Sync Cron Job — runs every 30 minutes via Vercel Cron
 *
 * Vercel calls GET /api/cron/sync with:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Syncs products + orders for all active integrations across all orgs.
 * Only SHOPIFY, SHOPEE, and LAZADA are currently supported by the sync engine.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncProducts, syncOrders } from "@/lib/sync";

const SUPPORTED_PLATFORMS = ["SHOPIFY", "SHOPEE", "LAZADA"] as const;

export async function GET(request: NextRequest) {
  // Verify the request comes from Vercel Cron (or a trusted caller)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const results: Array<{
    integrationId: string;
    platform: string;
    orgId: string;
    products: { status: "ok" | "error"; count: number; error?: string };
    orders: { status: "ok" | "error"; count: number; error?: string };
  }> = [];

  try {
    // Fetch all active integrations for supported platforms
    const integrations = await prisma.platformIntegration.findMany({
      where: {
        isActive: true,
        platform: { in: SUPPORTED_PLATFORMS },
      },
      select: {
        id: true,
        platform: true,
        credentials: true,
        lastSyncAt: true,
        orgId: true,
      },
    });

    if (integrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active integrations to sync",
        duration_ms: Date.now() - startedAt.getTime(),
        results: [],
      });
    }

    // Sync each integration independently — one failure won't stop the others
    for (const integration of integrations) {
      const result = {
        integrationId: integration.id,
        platform: integration.platform,
        orgId: integration.orgId,
        products: { status: "ok" as "ok" | "error", count: 0 },
        orders: { status: "ok" as "ok" | "error", count: 0 },
      };

      // Create sync log entries
      const [productLog, orderLog] = await Promise.all([
        prisma.syncLog.create({
          data: {
            integrationId: integration.id,
            type: "PRODUCTS",
            status: "RUNNING",
            message: `[CRON] Syncing products from ${integration.platform}`,
          },
        }),
        prisma.syncLog.create({
          data: {
            integrationId: integration.id,
            type: "ORDERS",
            status: "RUNNING",
            message: `[CRON] Syncing orders from ${integration.platform}`,
          },
        }),
      ]);

      // Sync products
      try {
        const count = await syncProducts(integration, integration.orgId);
        result.products = { status: "ok", count };
        await prisma.syncLog.update({
          where: { id: productLog.id },
          data: {
            status: "SUCCESS",
            recordsCount: count,
            completedAt: new Date(),
            message: `[CRON] Synced ${count} products from ${integration.platform}`,
          },
        });
      } catch (err) {
        const msg = (err as Error).message;
        result.products = { status: "error", count: 0, error: msg };
        await prisma.syncLog.update({
          where: { id: productLog.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            message: `[CRON] Product sync failed: ${msg}`,
          },
        });
      }

      // Sync orders
      try {
        const count = await syncOrders(integration, integration.orgId);
        result.orders = { status: "ok", count };
        await prisma.syncLog.update({
          where: { id: orderLog.id },
          data: {
            status: "SUCCESS",
            recordsCount: count,
            completedAt: new Date(),
            message: `[CRON] Synced ${count} orders from ${integration.platform}`,
          },
        });
      } catch (err) {
        const msg = (err as Error).message;
        result.orders = { status: "error", count: 0, error: msg };
        await prisma.syncLog.update({
          where: { id: orderLog.id },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            message: `[CRON] Order sync failed: ${msg}`,
          },
        });
      }

      // Update lastSyncAt on the integration regardless of partial failures
      await prisma.platformIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      results.push(result);
    }

    const totalProducts = results.reduce((s, r) => s + r.products.count, 0);
    const totalOrders = results.reduce((s, r) => s + r.orders.count, 0);
    const errors = results.filter(
      (r) => r.products.status === "error" || r.orders.status === "error"
    ).length;

    return NextResponse.json({
      success: true,
      message: `Synced ${integrations.length} integration(s): ${totalProducts} products, ${totalOrders} orders${errors > 0 ? ` (${errors} with errors)` : ""}`,
      duration_ms: Date.now() - startedAt.getTime(),
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Cron sync failed: ${(error as Error).message}`,
        duration_ms: Date.now() - startedAt.getTime(),
      },
      { status: 500 }
    );
  }
}
