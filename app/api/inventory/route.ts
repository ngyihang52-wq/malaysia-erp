import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { aj } from "@/lib/arcjet";

export async function GET(request: NextRequest) {
  const decision = await aj.protect(request);
  if (decision.isDenied()) return apiError("Request blocked", 403);

  const auth = await requireAuth(request).catch(() => null);
  if (!auth) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";

  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { orgId: auth.orgId },
      orderBy: { isDefault: "desc" },
    });

    const where: Record<string, unknown> = { warehouse: { orgId: auth.orgId } };
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: { select: { sku: true, name: true, category: true } },
          variant: { select: { sku: true, name: true } },
          warehouse: { select: { name: true, code: true } },
          movements: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    const movements = await prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        inventoryItem: {
          include: {
            product: { select: { sku: true, name: true } },
            warehouse: { select: { name: true, orgId: true } },
          },
        },
      },
      where: { inventoryItem: { warehouse: { orgId: auth.orgId } } },
    });

    const mappedMovements = movements.map((m) => ({
      date: m.createdAt.toISOString(),
      sku: m.inventoryItem.product.sku,
      type: m.type, qty: m.quantity,
      reason: m.reason || "",
      warehouse: m.inventoryItem.warehouse.name,
    }));

    return NextResponse.json({
      success: true,
      data: { items, warehouses, movements: mappedMovements, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return apiError(`Failed to load inventory: ${(error as Error).message}`, 500);
  }
}
