import { NextRequest, NextResponse } from "next/server";
import { createLazadaClient } from "@/lib/integrations/lazada";
import { apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, ...params } = body;

    if (!credentials?.appKey || !credentials?.appSecret || !credentials?.accessToken) {
      return apiError("Lazada credentials (appKey, appSecret, accessToken) are required");
    }

    const client = createLazadaClient(credentials);

    switch (action) {
      case "test": {
        const seller = await client.getSellerInfo();
        return NextResponse.json({ success: true, data: { seller, connected: true } });
      }
      case "sync_products": {
        const response = await client.getProducts({ limit: params.limit || 50 });
        const products = (response?.products || []).map((p: Record<string, unknown>) => client.normalizeProduct(p));
        return NextResponse.json({ success: true, data: { products, count: products.length } });
      }
      case "sync_orders": {
        const response = await client.getOrders({
          created_after: params.createdAfter,
          status: params.status,
          limit: params.limit || 50,
        });
        const orders = (response?.data?.orders || []).map((o: Record<string, unknown>) => client.normalizeOrder(o));
        return NextResponse.json({ success: true, data: { orders, count: orders.length } });
      }
      case "update_stock": {
        const { sellerId, quantity } = params;
        const result = await client.updateStock(sellerId, quantity);
        return NextResponse.json({ success: true, data: result });
      }
      default:
        return apiError(`Unknown action: ${action}`);
    }
  } catch (error) {
    return apiError(`Lazada API error: ${(error as Error).message}`, 500);
  }
}
