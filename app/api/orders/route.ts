import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status") || "";
  const platform = searchParams.get("platform") || "";
  const search = searchParams.get("search") || "";

  try {
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (platform) {
      where.integration = { platform };
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true, email: true } },
          integration: { select: { platform: true } },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      platform: o.integration?.platform || "DIRECT",
      customer: o.customer?.name || "Unknown",
      email: o.customer?.email || "",
      items: o.items.length,
      subtotal: Number(o.subtotal),
      shippingFee: Number(o.shippingFee),
      discount: Number(o.discount),
      total: Number(o.total),
      status: o.status,
      payment: o.paymentStatus,
      tracking: o.trackingNumber,
      date: o.placedAt?.toISOString() || o.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: mapped,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        filters: { status, platform, search },
      },
    });
  } catch (error) {
    return apiError(`Failed to load orders: ${(error as Error).message}`, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = await prisma.order.create({
      data: {
        orderNumber: body.orderNumber || `MY-${Date.now().toString(36).toUpperCase()}`,
        subtotal: body.subtotal || 0,
        total: body.total || 0,
        status: body.status || "PENDING",
      },
    });
    return NextResponse.json({ success: true, data: { order } }, { status: 201 });
  } catch (error) {
    return apiError(`Failed to create order: ${(error as Error).message}`, 500);
  }
}
