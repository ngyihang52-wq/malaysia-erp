import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  // In production: query prisma DB
  return NextResponse.json({
    success: true,
    data: {
      products: [],
      pagination: { page, limit, total: 0, pages: 0 },
      filters: { search, category },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.sku || !body.costPrice) {
      return apiError("Name, SKU, and cost price are required");
    }

    // In production: create in DB with prisma
    return NextResponse.json({
      success: true,
      data: { product: { id: `prod_${Date.now()}`, ...body, createdAt: new Date().toISOString() } },
    }, { status: 201 });
  } catch {
    return apiError("Failed to create product", 500);
  }
}
