import { NextRequest, NextResponse } from "next/server";
import { createShopeeClient } from "@/lib/integrations/shopee";
import { apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, ...params } = body;

    if (!credentials?.partnerId || !credentials?.partnerKey || !credentials?.shopId) {
      return apiError("Shopee credentials (partnerId, partnerKey, shopId, accessToken) are required");
    }

    const client = createShopeeClient(credentials);

    switch (action) {
      case "test": {
        const shopInfo = await client.getShopInfo();
        return NextResponse.json({ success: true, data: { shopInfo, connected: true } });
      }
      case "sync_products": {
        const response = await client.getItemList({ page_size: params.limit || 100 });
        return NextResponse.json({ success: true, data: { items: response?.item || [], count: response?.total_count || 0 } });
      }
      case "sync_orders": {
        const response = await client.getOrderList({
          time_from: params.timeFrom,
          time_to: params.timeTo,
          order_status: params.status || "ALL",
        });
        const orderSns = (response?.order_list || []).map((o: Record<string, unknown>) => o.order_sn as string);
        const orders = orderSns.length > 0 ? await client.getOrderDetail(orderSns) : [];
        return NextResponse.json({ success: true, data: { orders, count: orders.length } });
      }
      case "update_stock": {
        const { itemId, models } = params;
        const result = await client.updateStock(itemId, models);
        return NextResponse.json({ success: true, data: result });
      }
      default:
        return apiError(`Unknown action: ${action}`);
    }
  } catch (error) {
    return apiError(`Shopee API error: ${(error as Error).message}`, 500);
  }
}
