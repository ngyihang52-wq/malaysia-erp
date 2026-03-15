import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncProducts, syncOrders } from "@/lib/sync";
import { apiError } from "@/lib/utils";

/**
 * POST /api/sync?platform=SHOPIFY&type=PRODUCTS
 * Triggers real sync from a platform
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform")?.toUpperCase();
  const type = searchParams.get("type")?.toUpperCase() || "PRODUCTS";

  if (!platform) {
    return apiError("Platform parameter is required");
  }

  const validPlatforms = ["SHOPIFY", "SHOPEE", "LAZADA"];
  if (!validPlatforms.includes(platform)) {
    return apiError(`Sync supported for: ${validPlatforms.join(", ")}`);
  }

  try {
    // Load integration from DB
    const integration = await prisma.platformIntegration.findUnique({
      where: { platform: platform as "SHOPIFY" | "SHOPEE" | "LAZADA" },
    });

    if (!integration || !integration.isActive) {
      return apiError(`${platform} integration not found or inactive. Please connect it first.`);
    }

    // Create sync log
    const syncLog = await prisma.syncLog.create({
      data: {
        integrationId: integration.id,
        type: type as "PRODUCTS" | "ORDERS" | "INVENTORY" | "CUSTOMERS",
        status: "RUNNING",
        message: `Syncing ${type} from ${platform}...`,
      },
    });

    let recordsCount = 0;
    let errorMessage: string | null = null;

    try {
      if (type === "PRODUCTS") {
        recordsCount = await syncProducts(integration);
      } else if (type === "ORDERS") {
        recordsCount = await syncOrders(integration);
      } else {
        throw new Error(`Sync type ${type} not yet implemented`);
      }

      // Update sync log as SUCCESS
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "SUCCESS",
          recordsCount,
          completedAt: new Date(),
          message: `Successfully synced ${recordsCount} ${type.toLowerCase()} from ${platform}`,
        },
      });

      // Update lastSyncAt on integration
      await prisma.platformIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (syncError) {
      errorMessage = (syncError as Error).message;
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          message: `Sync failed: ${errorMessage}`,
        },
      });
    }

    return NextResponse.json({
      success: !errorMessage,
      data: {
        syncId: syncLog.id,
        platform,
        type,
        status: errorMessage ? "FAILED" : "SUCCESS",
        recordsCount,
        message: errorMessage || `Successfully synced ${recordsCount} ${type.toLowerCase()}`,
      },
    });
  } catch (error) {
    return apiError(`Sync failed: ${(error as Error).message}`, 500);
  }
}

/**
 * GET /api/sync?platform=SHOPIFY
 * Get recent sync logs for a platform
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform")?.toUpperCase();

  try {
    const where = platform
      ? { integration: { platform: platform as "SHOPIFY" | "SHOPEE" | "LAZADA" } }
      : {};

    const logs = await prisma.syncLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        integration: { select: { platform: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return apiError(`Failed to load sync logs: ${(error as Error).message}`, 500);
  }
}
