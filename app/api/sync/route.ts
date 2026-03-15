import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";

/**
 * Sync endpoint - triggers data sync from a specific platform
 * POST /api/sync?platform=SHOPEE&type=ORDERS
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform")?.toUpperCase();
  const type = searchParams.get("type")?.toUpperCase() || "ORDERS";

  if (!platform) {
    return apiError("Platform parameter is required");
  }

  const validPlatforms = ["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"];
  if (!validPlatforms.includes(platform)) {
    return apiError(`Invalid platform. Must be one of: ${validPlatforms.join(", ")}`);
  }

  try {
    // In production: trigger actual platform sync
    // const integration = await prisma.platformIntegration.findFirst({ where: { platform, isActive: true } });
    // if (!integration) return apiError(`${platform} integration not found or inactive`);

    // Simulate sync
    const syncId = `sync_${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        syncId,
        platform,
        type,
        status: "RUNNING",
        startedAt: new Date().toISOString(),
        message: `Syncing ${type} from ${platform}...`,
      },
    });
  } catch (error) {
    return apiError(`Sync failed: ${(error as Error).message}`, 500);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const syncId = searchParams.get("syncId");

  if (!syncId) {
    return apiError("syncId is required");
  }

  // Return sync status - in production, fetch from DB
  return NextResponse.json({
    success: true,
    data: {
      syncId,
      status: "SUCCESS",
      recordsCount: Math.floor(Math.random() * 50) + 5,
      completedAt: new Date().toISOString(),
    },
  });
}
