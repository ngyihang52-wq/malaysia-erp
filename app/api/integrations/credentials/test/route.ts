import { NextRequest, NextResponse } from "next/server";
import { createShopifyClient } from "@/lib/integrations/shopify";
import { createShopeeClient } from "@/lib/integrations/shopee";
import { createLazadaClient } from "@/lib/integrations/lazada";
import { apiError } from "@/lib/utils";

/**
 * POST /api/integrations/credentials/test
 * Test platform credentials without saving them
 * Body: { platform: "SHOPIFY", credentials: { shopDomain, accessToken } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, credentials } = body;

    if (!platform || !credentials) {
      return apiError("platform and credentials are required");
    }

    let result: Record<string, unknown> = {};

    switch (platform.toUpperCase()) {
      case "SHOPIFY": {
        if (!credentials.shopDomain || !credentials.accessToken) {
          return apiError("shopDomain and accessToken are required for Shopify");
        }
        const client = createShopifyClient(credentials);
        const shop = await client.getShop();
        result = { connected: true, shopName: shop.name, domain: shop.domain };
        break;
      }
      case "SHOPEE": {
        if (!credentials.partnerId || !credentials.partnerKey || !credentials.shopId || !credentials.accessToken) {
          return apiError("partnerId, partnerKey, shopId, and accessToken are required for Shopee");
        }
        const client = createShopeeClient({
          ...credentials,
          partnerId: Number(credentials.partnerId),
          shopId: Number(credentials.shopId),
        });
        const shopInfo = await client.getShopInfo();
        result = { connected: true, shopName: shopInfo.shop_name || "Shopee Store" };
        break;
      }
      case "LAZADA": {
        if (!credentials.appKey || !credentials.appSecret || !credentials.accessToken) {
          return apiError("appKey, appSecret, and accessToken are required for Lazada");
        }
        const client = createLazadaClient(credentials);
        const seller = await client.getSellerInfo();
        result = { connected: true, shopName: seller.data?.name || "Lazada Store" };
        break;
      }
      default:
        return apiError(`Platform ${platform} testing not supported yet`);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = (error as Error).message;
    return NextResponse.json(
      { success: false, error: `Connection failed: ${message}` },
      { status: 400 }
    );
  }
}
