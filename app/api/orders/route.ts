import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "";
  const platform = searchParams.get("platform") || "";
  const search = searchParams.get("search") || "";

  // In production: query prisma DB
  return NextResponse.json({
    success: true,
    data: {
      orders: [],
      pagination: { page, limit, total: 0, pages: 0 },
      filters: { status, platform, search },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // In production: create order in DB
    return NextResponse.json({
      success: true,
      data: { order: { id: `order_${Date.now()}`, ...body, createdAt: new Date().toISOString() } },
    }, { status: 201 });
  } catch {
    return apiError("Failed to create order", 500);
  }
}
