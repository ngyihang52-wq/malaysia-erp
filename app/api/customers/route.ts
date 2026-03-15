import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const platform = searchParams.get("platform") || "";

  try {
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }
    if (platform) {
      where.platform = platform;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { totalSpent: "desc" },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { orderNumber: true, createdAt: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const mapped = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      city: c.city || "",
      state: c.state || "",
      platform: c.platform || "DIRECT",
      orders: c.totalOrders,
      totalSpent: Number(c.totalSpent),
      lastOrder: c.orders[0]?.createdAt?.toISOString() || "",
      lastOrderId: c.orders[0]?.orderNumber || "",
      joined: c.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        customers: mapped,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        filters: { search, platform },
      },
    });
  } catch (error) {
    return apiError(`Failed to load customers: ${(error as Error).message}`, 500);
  }
}
