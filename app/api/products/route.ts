import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  try {
    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          variants: true,
          channelProducts: {
            include: { integration: { select: { platform: true, name: true } } },
          },
          inventoryItems: {
            include: { warehouse: { select: { name: true, code: true } } },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Map to page-friendly format
    const mapped = products.map((p) => {
      const channels: Record<string, number> = {};
      for (const cp of p.channelProducts) {
        channels[cp.integration.platform] = Number(cp.sellingPrice);
      }

      const stock: Record<string, number> = {};
      let totalStock = 0;
      for (const inv of p.inventoryItems) {
        stock[inv.warehouse.name] = inv.quantity;
        totalStock += inv.quantity;
      }

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category || "Uncategorized",
        brand: p.brand || "",
        costPrice: Number(p.costPrice),
        variants: p.variants.length,
        channels,
        stock,
        totalStock,
        isActive: p.isActive,
        image: p.images[0] || "",
        images: p.images,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        products: mapped,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        filters: { search, category },
      },
    });
  } catch (error) {
    return apiError(`Failed to load products: ${(error as Error).message}`, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.sku || body.costPrice === undefined) {
      return apiError("Name, SKU, and cost price are required");
    }

    const product = await prisma.product.create({
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description || "",
        category: body.category || "Uncategorized",
        brand: body.brand || "",
        costPrice: body.costPrice,
        images: body.images || [],
        tags: body.tags || [],
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: { product } }, { status: 201 });
  } catch (error) {
    return apiError(`Failed to create product: ${(error as Error).message}`, 500);
  }
}
