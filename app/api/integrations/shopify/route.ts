import { NextRequest, NextResponse } from "next/server";
import { createShopifyClient } from "@/lib/integrations/shopify";
import { apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "status";

  return NextResponse.json({
    success: true,
    data: { platform: "SHOPIFY", action, status: "ok" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, ...params } = body;

    if (!credentials?.shopDomain || !credentials?.accessToken) {
      return apiError("Shopify credentials (shopDomain, accessToken) are required");
    }

    const client = createShopifyClient(credentials);

    switch (action) {
      case "test": {
        const shop = await client.getShop();
        return NextResponse.json({ success: true, data: { shop, connected: true } });
      }
      case "sync_products": {
        const products = await client.getProducts({ limit: params.limit || 50 });
        const normalized = products.map((p: Record<string, unknown>) => client.normalizeProduct(p));
        return NextResponse.json({ success: true, data: { products: normalized, count: normalized.length } });
      }
      case "sync_orders": {
        const orders = await client.getOrders({ limit: params.limit || 50, status: "any" });
        const normalized = orders.map((o: Record<string, unknown>) => client.normalizeOrder(o));
        return NextResponse.json({ success: true, data: { orders: normalized, count: normalized.length } });
      }
      case "update_inventory": {
        const { inventoryItemId, locationId, available } = params;
        const result = await client.setInventoryLevel(inventoryItemId, locationId, available);
        return NextResponse.json({ success: true, data: result });
      }
      default:
        return apiError(`Unknown action: ${action}`);
    }
  } catch (error) {
    return apiError(`Shopify API error: ${(error as Error).message}`, 500);
  }
}
