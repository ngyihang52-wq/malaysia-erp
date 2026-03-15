import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { encryptCredentials } from "@/lib/encrypt";
import { apiError } from "@/lib/utils";

/**
 * GET /api/integrations/credentials
 * List all platform integrations (credentials masked)
 */
export async function GET() {
  try {
    const integrations = await prisma.platformIntegration.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        syncLogs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    const masked = integrations.map((i) => ({
      id: i.id,
      platform: i.platform,
      name: i.name,
      isActive: i.isActive,
      lastSyncAt: i.lastSyncAt,
      createdAt: i.createdAt,
      lastSync: i.syncLogs[0] || null,
    }));

    return NextResponse.json({ success: true, data: masked });
  } catch (error) {
    return apiError(`Failed to load integrations: ${(error as Error).message}`, 500);
  }
}

/**
 * POST /api/integrations/credentials
 * Create or update a platform integration with encrypted credentials
 * Body: { platform: "SHOPIFY", name: "My Store", credentials: { shopDomain, accessToken } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, name, credentials } = body;

    if (!platform || !credentials) {
      return apiError("platform and credentials are required");
    }

    const validPlatforms = ["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"];
    if (!validPlatforms.includes(platform)) {
      return apiError(`Invalid platform. Must be one of: ${validPlatforms.join(", ")}`);
    }

    const encrypted = encryptCredentials(credentials);

    const integration = await prisma.platformIntegration.upsert({
      where: {
        platform: platform,
      },
      create: {
        platform,
        name: name || platform,
        credentials: encrypted,
        isActive: true,
      },
      update: {
        name: name || platform,
        credentials: encrypted,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: integration.id,
        platform: integration.platform,
        name: integration.name,
        isActive: integration.isActive,
      },
    });
  } catch (error) {
    return apiError(`Failed to save integration: ${(error as Error).message}`, 500);
  }
}

/**
 * DELETE /api/integrations/credentials?platform=SHOPIFY
 * Deactivate a platform integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform")?.toUpperCase();

    if (!platform) {
      return apiError("platform parameter is required");
    }

    await prisma.platformIntegration.updateMany({
      where: { platform: platform as "SHOPIFY" | "TIKTOK" | "SHOPEE" | "LAZADA" | "AMAZON" },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: { platform, disconnected: true } });
  } catch (error) {
    return apiError(`Failed to disconnect: ${(error as Error).message}`, 500);
  }
}
