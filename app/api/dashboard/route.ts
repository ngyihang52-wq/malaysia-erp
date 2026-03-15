import { NextResponse } from "next/server";

export async function GET() {
  // In production, fetch from DB with prisma
  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalRevenue: 142890,
        totalOrders: 1248,
        activeProducts: 386,
        lowStockAlerts: 14,
        newCustomers: 89,
      },
      platforms: [
        { name: "SHOPIFY", orders: 248, revenue: 35200, status: "active" },
        { name: "TIKTOK", orders: 312, revenue: 28900, status: "active" },
        { name: "SHOPEE", orders: 389, revenue: 45600, status: "active" },
        { name: "LAZADA", orders: 186, revenue: 22100, status: "active" },
        { name: "AMAZON", orders: 113, revenue: 11090, status: "disconnected" },
      ],
      recentOrders: [],
      lowStockItems: [],
    },
  });
}
