import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/utils";

/**
 * GET /api/sync/history
 * Get recent sync history across all platforms (for integrations page)
 */
export async function GET() {
  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        integration: { select: { platform: true, name: true } },
      },
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      platform: log.integration.platform,
      platformName: log.integration.name,
      type: log.type,
      status: log.status,
      recordsCount: log.recordsCount,
      message: log.message,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return apiError(`Failed to load sync history: ${(error as Error).message}`, 500);
  }
}
