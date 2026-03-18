import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncProducts, syncOrders } from "@/lib/sync";
import { apiError } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { ajSync } from "@/lib/arcjet";

export async function POST(request: NextRequest) {
  const decision = await ajSync.protect(request);
  if (decision.isDenied()) return apiError("Too many sync requests. Please wait and try again.", 429);

  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform")?.toUpperCase();
  const type = searchParams.get("type")?.toUpperCase() || "PRODUCTS";

  if (!platform) return apiError("Platform parameter is required");

  const validPlatforms = ["SHOPIFY", "SHOPEE", "LAZADA"];
  if (!validPlatforms.includes(platform)) return apiError(`Sync supported for: ${validPlatforms.join(", ")}`);

  try {
    const integration = await prisma.platformIntegration.findUnique({
      where: { platform_orgId: { platform: platform as "SHOPIFY" | "SHOPEE" | "LAZADA", orgId: auth.orgId } },
    });

    if (!integration || !integration.isActive) {
      return apiError(`${platform} integration not found or inactive. Please connect it first.`);
    }

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
        recordsCount = await syncProducts(integration, auth.orgId);
      } else if (type === "ORDERS") {
        recordsCount = await syncOrders(integration, auth.orgId);
      } else {
        throw new Error(`Sync type ${type} not yet implemented`);
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "SUCCESS", recordsCount, completedAt: new Date(), message: `Successfully synced ${recordsCount} ${type.toLowerCase()} from ${platform}` },
      });
      await prisma.platformIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (syncError) {
      errorMessage = (syncError as Error).message;
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "FAILED", completedAt: new Date(), message: `Sync failed: ${errorMessage}` },
      });
    }

    return NextResponse.json({
      success: !errorMessage,
      data: { syncId: syncLog.id, platform, type, status: errorMessage ? "FAILED" : "SUCCESS", recordsCount, message: errorMessage || `Successfully synced ${recordsCount} ${type.toLowerCase()}` },
    });
  } catch (error) {
    return apiError(`Sync failed: ${(error as Error).message}`, 500);
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform")?.toUpperCase();

  try {
    const where = platform
      ? { integration: { platform: platform as "SHOPIFY" | "SHOPEE" | "LAZADA", orgId: auth.orgId } }
      : { integration: { orgId: auth.orgId } };

    const logs = await prisma.syncLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { integration: { select: { platform: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return apiError(`Failed to load sync logs: ${(error as Error).message}`, 500);
  }
}
