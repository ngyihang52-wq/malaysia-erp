/**
 * Sync Engine — Fetches data from platforms and stores in database
 * Uses existing integration clients from lib/integrations/
 */
import prisma from "@/lib/db";
import { decryptCredentials } from "@/lib/encrypt";
import { createShopifyClient } from "@/lib/integrations/shopify";
import { createShopeeClient } from "@/lib/integrations/shopee";
import { createLazadaClient } from "@/lib/integrations/lazada";
import { generateOrderNumber } from "@/lib/utils";

type PlatformIntegrationRecord = {
  id: string;
  platform: string;
  credentials: unknown;
  lastSyncAt: Date | null;
};

// ============================================================
// PRODUCT SYNC
// ============================================================

export async function syncProducts(integration: PlatformIntegrationRecord, orgId: string) {
  const credentials = decryptCredentials(integration.credentials as string);
  const platform = integration.platform;
  let rawProducts: Record<string, unknown>[] = [];

  switch (platform) {
    case "SHOPIFY": {
      const client = createShopifyClient(credentials as { shopDomain: string; accessToken: string });
      rawProducts = await client.getProducts({ limit: 250 });
      return await upsertShopifyProducts(rawProducts, client, integration, orgId);
    }
    case "SHOPEE": {
      const client = createShopeeClient({
        partnerId: Number(credentials.partnerId),
        partnerKey: credentials.partnerKey as string,
        shopId: Number(credentials.shopId),
        accessToken: credentials.accessToken as string,
      });
      const itemList = await client.getItemList({ page_size: 100 });
      const itemIds = (itemList?.item || []).map((i: Record<string, unknown>) => i.item_id as number);
      if (itemIds.length > 0) {
        const details = await client.getItemDetail(itemIds);
        rawProducts = details?.item_list || [];
      }
      return await upsertShopeeProducts(rawProducts, client, integration, orgId);
    }
    case "LAZADA": {
      const client = createLazadaClient(credentials as { appKey: string; appSecret: string; accessToken: string });
      const result = await client.getProducts({ limit: 50 });
      rawProducts = result?.products || [];
      return await upsertLazadaProducts(rawProducts, client, integration, orgId);
    }
    default:
      throw new Error(`Product sync not supported for ${platform}`);
  }
}

async function upsertShopifyProducts(
  rawProducts: Record<string, unknown>[],
  client: ReturnType<typeof createShopifyClient>,
  integration: PlatformIntegrationRecord,
  orgId: string
) {
  let count = 0;

  for (const raw of rawProducts) {
    const normalized = client.normalizeProduct(raw);
    const firstVariant = normalized.variants?.[0];
    const sku = firstVariant?.sku || `SHOP-${normalized.externalId}`;

    const product = await prisma.product.upsert({
      where: { sku_orgId: { sku, orgId } },
      create: {
        sku, orgId,
        name: normalized.name,
        description: normalized.description || "",
        category: normalized.category || "Uncategorized",
        costPrice: firstVariant?.price || 0,
        images: normalized.images || [],
        tags: normalized.tags || [],
        isActive: true,
      },
      update: {
        name: normalized.name,
        description: normalized.description || "",
        category: normalized.category || "Uncategorized",
        images: normalized.images || [],
        tags: normalized.tags || [],
      },
    });

    for (const v of normalized.variants || []) {
      const variantSku = v.sku || `${sku}-${v.externalId}`;
      await prisma.productVariant.upsert({
        where: { sku_productId: { sku: variantSku, productId: product.id } },
        create: {
          productId: product.id,
          sku: variantSku,
          name: v.name || "Default",
          attributes: {},
          costPrice: v.price || 0,
          isActive: true,
        },
        update: { name: v.name || "Default", costPrice: v.price || 0 },
      });
    }

    await prisma.channelProduct.upsert({
      where: { productId_integrationId: { productId: product.id, integrationId: integration.id } },
      create: {
        productId: product.id, integrationId: integration.id,
        externalId: normalized.externalId, sellingPrice: firstVariant?.price || 0,
        status: "ACTIVE", syncedAt: new Date(),
      },
      update: { externalId: normalized.externalId, sellingPrice: firstVariant?.price || 0, status: "ACTIVE", syncedAt: new Date() },
    });

    count++;
  }
  return count;
}

async function upsertShopeeProducts(
  rawProducts: Record<string, unknown>[],
  client: ReturnType<typeof createShopeeClient>,
  integration: PlatformIntegrationRecord,
  orgId: string
) {
  let count = 0;

  for (const raw of rawProducts) {
    const normalized = client.normalizeProduct(raw);
    const sku = `SPE-${normalized.externalId}`;

    const product = await prisma.product.upsert({
      where: { sku_orgId: { sku, orgId } },
      create: {
        sku, orgId,
        name: normalized.name,
        description: normalized.description || "",
        category: normalized.category || "Uncategorized",
        costPrice: 0, images: normalized.images || [], isActive: true,
      },
      update: { name: normalized.name, description: normalized.description || "", images: normalized.images || [] },
    });

    await prisma.channelProduct.upsert({
      where: { productId_integrationId: { productId: product.id, integrationId: integration.id } },
      create: { productId: product.id, integrationId: integration.id, externalId: normalized.externalId, sellingPrice: 0, status: "ACTIVE", syncedAt: new Date() },
      update: { externalId: normalized.externalId, syncedAt: new Date() },
    });

    count++;
  }
  return count;
}

async function upsertLazadaProducts(
  rawProducts: Record<string, unknown>[],
  client: ReturnType<typeof createLazadaClient>,
  integration: PlatformIntegrationRecord,
  orgId: string
) {
  let count = 0;

  for (const raw of rawProducts) {
    const normalized = client.normalizeProduct(raw);
    const firstVariant = normalized.variants?.[0];
    const sku = firstVariant?.sku || `LZD-${normalized.externalId}`;

    const product = await prisma.product.upsert({
      where: { sku_orgId: { sku, orgId } },
      create: {
        sku, orgId,
        name: normalized.name,
        description: normalized.description || "",
        category: normalized.category || "Uncategorized",
        costPrice: firstVariant?.price || 0, images: normalized.images || [], isActive: true,
      },
      update: { name: normalized.name, description: normalized.description || "", images: normalized.images || [] },
    });

    for (const v of normalized.variants || []) {
      const variantSku = v.sku || `${sku}-${v.externalId}`;
      await prisma.productVariant.upsert({
        where: { sku_productId: { sku: variantSku, productId: product.id } },
        create: { productId: product.id, sku: variantSku, name: v.name || "Default", attributes: {}, costPrice: v.price || 0, isActive: true },
        update: { name: v.name || "Default", costPrice: v.price || 0 },
      });
    }

    await prisma.channelProduct.upsert({
      where: { productId_integrationId: { productId: product.id, integrationId: integration.id } },
      create: { productId: product.id, integrationId: integration.id, externalId: normalized.externalId, sellingPrice: firstVariant?.price || 0, status: "ACTIVE", syncedAt: new Date() },
      update: { externalId: normalized.externalId, sellingPrice: firstVariant?.price || 0, syncedAt: new Date() },
    });

    count++;
  }
  return count;
}

// ============================================================
// ORDER SYNC
// ============================================================

export async function syncOrders(integration: PlatformIntegrationRecord, orgId: string) {
  const credentials = decryptCredentials(integration.credentials as string);
  const platform = integration.platform;

  switch (platform) {
    case "SHOPIFY": {
      const client = createShopifyClient(credentials as { shopDomain: string; accessToken: string });
      const sinceDate = integration.lastSyncAt
        ? integration.lastSyncAt.toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const rawOrders = await client.getOrders({ limit: 250, status: "any", created_at_min: sinceDate });
      return await upsertOrders(rawOrders, client, integration, "shopify", orgId);
    }
    case "SHOPEE": {
      const client = createShopeeClient({
        partnerId: Number(credentials.partnerId),
        partnerKey: credentials.partnerKey as string,
        shopId: Number(credentials.shopId),
        accessToken: credentials.accessToken as string,
      });
      const orderList = await client.getOrderList({ page_size: 50 });
      const orderSns = (orderList?.order_list || []).map((o: Record<string, unknown>) => o.order_sn as string);
      let rawOrders: Record<string, unknown>[] = [];
      if (orderSns.length > 0) {
        const details = await client.getOrderDetail(orderSns);
        rawOrders = details?.order_list || [];
      }
      return await upsertOrders(rawOrders, client, integration, "shopee", orgId);
    }
    case "LAZADA": {
      const client = createLazadaClient(credentials as { appKey: string; appSecret: string; accessToken: string });
      const sinceDate = integration.lastSyncAt
        ? integration.lastSyncAt.toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const result = await client.getOrders({ created_after: sinceDate, limit: 50 });
      const rawOrders = result?.orders || [];
      return await upsertOrders(rawOrders, client, integration, "lazada", orgId);
    }
    default:
      throw new Error(`Order sync not supported for ${platform}`);
  }
}

async function upsertOrders(
  rawOrders: Record<string, unknown>[],
  client: { normalizeOrder: (raw: Record<string, unknown>) => Record<string, unknown> },
  integration: PlatformIntegrationRecord,
  platform: string,
  orgId: string
) {
  let count = 0;
  const platformEnum = integration.platform as "SHOPIFY" | "SHOPEE" | "LAZADA";

  for (const raw of rawOrders) {
    const normalized = client.normalizeOrder(raw);

    let customerId: string | null = null;
    const customerData = normalized.customer as { name?: string; email?: string; phone?: string } | null;

    if (customerData?.name || customerData?.email) {
      const customerExternalId = customerData.email || customerData.phone || `${platform}-${normalized.externalId}`;

      const customer = await prisma.customer.upsert({
        where: {
          platform_externalId_orgId: {
            platform: platformEnum,
            externalId: customerExternalId,
            orgId,
          },
        },
        create: {
          name: customerData.name || "Unknown",
          email: customerData.email || null,
          phone: customerData.phone || null,
          platform: platformEnum,
          externalId: customerExternalId,
          totalOrders: 1,
          totalSpent: Number(normalized.total) || 0,
          orgId,
        },
        update: {
          name: customerData.name || "Unknown",
          totalOrders: { increment: 1 },
          totalSpent: { increment: Number(normalized.total) || 0 },
        },
      });
      customerId = customer.id;
    }

    const existingOrder = await prisma.order.findFirst({
      where: { externalId: normalized.externalId as string, orgId },
    });

    if (existingOrder) {
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: (normalized.status as string) as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED" | "REFUNDED",
        },
      });
    } else {
      const shippingAddr = normalized.shippingAddress as Record<string, unknown> | null;
      const orderNumber = (normalized.orderNumber as string) || generateOrderNumber();

      await prisma.order.create({
        data: {
          orderNumber,
          externalId: normalized.externalId as string,
          integrationId: integration.id,
          customerId,
          orgId,
          status: (normalized.status as string) as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED" | "REFUNDED",
          paymentStatus: "PAID",
          fulfillmentStatus: "UNFULFILLED",
          subtotal: Number(normalized.subtotal) || 0,
          shippingFee: Number(normalized.shippingFee) || 0,
          discount: Number(normalized.discount) || 0,
          tax: 0,
          total: Number(normalized.total) || 0,
          shippingAddress: shippingAddr ? JSON.parse(JSON.stringify(shippingAddr)) : undefined,
          placedAt: normalized.placedAt ? new Date(normalized.placedAt as string) : new Date(),
          items: {
            create: ((normalized.items as Record<string, unknown>[]) || []).map((item) => ({
              externalId: item.externalId as string,
              name: item.name as string,
              sku: (item.sku as string) || null,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              total: Number(item.total) || 0,
            })),
          },
        },
      });
    }

    count++;
  }

  return count;
}
