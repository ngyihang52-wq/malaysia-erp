import { NextRequest, NextResponse } from "next/server";
import { createTikTokClient } from "@/lib/integrations/tiktok";
import { apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, ...params } = body;

    if (!credentials?.appKey || !credentials?.appSecret || !credentials?.accessToken) {
      return apiError("TikTok credentials (appKey, appSecret, accessToken) are required");
    }

    const client = createTikTokClient(credentials);

    switch (action) {
      case "test": {
        const shops = await client.getAuthorizedShops();
        return NextResponse.json({ success: true, data: { shops, connected: true } });
      }
      case "sync_products": {
        const response = await client.getProducts({ page_size: params.limit || 100 });
        const products = (response?.products || []).map((p: Record<string, unknown>) => client.normalizeProduct(p));
        return NextResponse.json({ success: true, data: { products, count: products.length } });
      }
      case "sync_orders": {
        const response = await client.getOrders({ create_time_from: params.timeFrom, create_time_to: params.timeTo });
        const orders = (response?.order_list || []).map((o: Record<string, unknown>) => client.normalizeOrder(o));
        return NextResponse.json({ success: true, data: { orders, count: orders.length } });
      }
      default:
        return apiError(`Unknown action: ${action}`);
    }
  } catch (error) {
    return apiError(`TikTok API error: ${(error as Error).message}`, 500);
  }
}
