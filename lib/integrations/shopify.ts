/**
 * Shopify Integration
 * Uses Shopify Admin REST API v2024-01
 * Docs: https://shopify.dev/docs/api/admin-rest
 */
import axios, { AxiosInstance } from "axios";

export interface ShopifyCredentials {
  shopDomain: string;    // e.g. mystore.myshopify.com
  accessToken: string;
  apiVersion?: string;
}

export class ShopifyClient {
  private client: AxiosInstance;
  private shopDomain: string;
  private apiVersion: string;

  constructor(credentials: ShopifyCredentials) {
    this.shopDomain = credentials.shopDomain;
    this.apiVersion = credentials.apiVersion || "2024-01";

    this.client = axios.create({
      baseURL: `https://${this.shopDomain}/admin/api/${this.apiVersion}`,
      headers: {
        "X-Shopify-Access-Token": credentials.accessToken,
        "Content-Type": "application/json",
      },
    });
  }

  // ---- SHOP ----
  async getShop() {
    const res = await this.client.get("/shop.json");
    return res.data.shop;
  }

  // ---- PRODUCTS ----
  async getProducts(params: { limit?: number; since_id?: string; page_info?: string } = {}) {
    const res = await this.client.get("/products.json", { params: { limit: 250, ...params } });
    return res.data.products;
  }

  async getProduct(productId: string) {
    const res = await this.client.get(`/products/${productId}.json`);
    return res.data.product;
  }

  async createProduct(product: Record<string, unknown>) {
    const res = await this.client.post("/products.json", { product });
    return res.data.product;
  }

  async updateProduct(productId: string, product: Record<string, unknown>) {
    const res = await this.client.put(`/products/${productId}.json`, { product });
    return res.data.product;
  }

  // ---- INVENTORY ----
  async getInventoryLevels(inventoryItemIds: string[]) {
    const res = await this.client.get("/inventory_levels.json", {
      params: { inventory_item_ids: inventoryItemIds.join(",") },
    });
    return res.data.inventory_levels;
  }

  async setInventoryLevel(inventoryItemId: string, locationId: string, available: number) {
    const res = await this.client.post("/inventory_levels/set.json", {
      inventory_item_id: inventoryItemId,
      location_id: locationId,
      available,
    });
    return res.data.inventory_level;
  }

  async getLocations() {
    const res = await this.client.get("/locations.json");
    return res.data.locations;
  }

  // ---- ORDERS ----
  async getOrders(params: { limit?: number; status?: string; since_id?: string; created_at_min?: string } = {}) {
    const res = await this.client.get("/orders.json", { params: { limit: 250, ...params } });
    return res.data.orders;
  }

  async getOrder(orderId: string) {
    const res = await this.client.get(`/orders/${orderId}.json`);
    return res.data.order;
  }

  async fulfillOrder(orderId: string, fulfillment: Record<string, unknown>) {
    const res = await this.client.post(`/orders/${orderId}/fulfillments.json`, { fulfillment });
    return res.data.fulfillment;
  }

  // ---- WEBHOOKS ----
  async createWebhook(topic: string, address: string) {
    const res = await this.client.post("/webhooks.json", {
      webhook: { topic, address, format: "json" },
    });
    return res.data.webhook;
  }

  async getWebhooks() {
    const res = await this.client.get("/webhooks.json");
    return res.data.webhooks;
  }

  // ---- NORMALIZE ----
  normalizeProduct(shopifyProduct: Record<string, unknown>) {
    const variants = shopifyProduct.variants as Record<string, unknown>[];
    return {
      externalId: String(shopifyProduct.id),
      name: shopifyProduct.title as string,
      description: shopifyProduct.body_html as string,
      category: shopifyProduct.product_type as string,
      tags: (shopifyProduct.tags as string || "").split(",").map((t: string) => t.trim()).filter(Boolean),
      images: ((shopifyProduct.images as Record<string, unknown>[]) || []).map((img) => img.src as string),
      variants: variants?.map((v: Record<string, unknown>) => ({
        externalId: String(v.id),
        sku: v.sku as string,
        name: v.title as string,
        price: parseFloat(v.price as string),
        inventoryItemId: String(v.inventory_item_id),
        inventoryQuantity: v.inventory_quantity as number,
      })),
    };
  }

  normalizeOrder(shopifyOrder: Record<string, unknown>) {
    const customer = shopifyOrder.customer as Record<string, unknown>;
    const lineItems = shopifyOrder.line_items as Record<string, unknown>[];
    const shippingAddress = shopifyOrder.shipping_address as Record<string, unknown>;

    return {
      externalId: String(shopifyOrder.id),
      orderNumber: shopifyOrder.order_number as string,
      status: this.mapOrderStatus(shopifyOrder.financial_status as string, shopifyOrder.fulfillment_status as string),
      customer: customer ? {
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email as string,
        phone: customer.phone as string,
      } : null,
      shippingAddress: shippingAddress ? {
        name: shippingAddress.name as string,
        address: shippingAddress.address1 as string,
        city: shippingAddress.city as string,
        state: shippingAddress.province as string,
        postcode: shippingAddress.zip as string,
        country: shippingAddress.country as string,
      } : null,
      subtotal: parseFloat(shopifyOrder.subtotal_price as string),
      shippingFee: parseFloat(((shopifyOrder.total_shipping_price_set as Record<string, unknown>)?.shop_money as Record<string, unknown>)?.amount as string || "0"),
      discount: parseFloat(shopifyOrder.total_discounts as string),
      total: parseFloat(shopifyOrder.total_price as string),
      items: lineItems?.map((item: Record<string, unknown>) => ({
        externalId: String(item.id),
        name: item.name as string,
        sku: item.sku as string,
        quantity: item.quantity as number,
        unitPrice: parseFloat(item.price as string),
        total: parseFloat(item.price as string) * (item.quantity as number),
      })),
      placedAt: shopifyOrder.created_at as string,
    };
  }

  private mapOrderStatus(financialStatus: string, fulfillmentStatus: string): string {
    if (financialStatus === "refunded") return "REFUNDED";
    if (fulfillmentStatus === "fulfilled") return "DELIVERED";
    if (fulfillmentStatus === "partial") return "PROCESSING";
    if (financialStatus === "paid") return "CONFIRMED";
    return "PENDING";
  }
}

export function createShopifyClient(credentials: ShopifyCredentials) {
  return new ShopifyClient(credentials);
}
