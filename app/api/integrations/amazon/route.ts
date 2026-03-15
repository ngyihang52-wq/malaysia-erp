import { NextRequest, NextResponse } from "next/server";
import { createAmazonClient } from "@/lib/integrations/amazon";
import { apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, ...params } = body;

    if (!credentials?.accessKeyId || !credentials?.secretAccessKey || !credentials?.refreshToken) {
      return apiError("Amazon credentials (accessKeyId, secretAccessKey, refreshToken, clientId, clientSecret, sellerId) are required");
    }

    const client = createAmazonClient(credentials);

    switch (action) {
      case "test": {
        const orders = await client.getOrders({ maxResultsPerPage: 1 });
        return NextResponse.json({ success: true, data: { connected: true, ordersAvailable: !!orders } });
      }
      case "sync_orders": {
        const response = await client.getOrders({
          createdAfter: params.createdAfter,
          orderStatuses: params.statuses || ["Unshipped", "PartiallyShipped"],
          maxResultsPerPage: params.limit || 50,
        });
        const orders = (response?.Orders || []).map((o: Record<string, unknown>) => client.normalizeOrder(o));
        return NextResponse.json({ success: true, data: { orders, count: orders.length } });
      }
      case "sync_listings": {
        const listings = await client.getListings({ pageSize: params.limit || 50 });
        return NextResponse.json({ success: true, data: { listings, connected: true } });
      }
      case "sync_fba_inventory": {
        const inventory = await client.getFBAInventory({ details: true });
        return NextResponse.json({ success: true, data: { inventory } });
      }
      default:
        return apiError(`Unknown action: ${action}`);
    }
  } catch (error) {
    return apiError(`Amazon SP-API error: ${(error as Error).message}`, 500);
  }
}
