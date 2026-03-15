/**
 * TikTok Shop Integration
 * Uses TikTok Shop Open Platform API
 * Docs: https://partner.tiktokshop.com/docv2/page/open-api
 */
import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

export interface TikTokCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  shopId?: string;
}

export class TikTokClient {
  private appKey: string;
  private appSecret: string;
  private accessToken: string;
  private shopId: string;
  private baseURL = "https://open-api.tiktokglobalshop.com";
  private client: AxiosInstance;

  constructor(credentials: TikTokCredentials) {
    this.appKey = credentials.appKey;
    this.appSecret = credentials.appSecret;
    this.accessToken = credentials.accessToken;
    this.shopId = credentials.shopId || "";

    this.client = axios.create({ baseURL: this.baseURL });
  }

  private generateSignature(path: string, params: Record<string, string>, body = ""): string {
    const sortedParams = Object.keys(params)
      .filter((k) => k !== "sign" && k !== "access_token")
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");

    const signString = `${this.appSecret}${path}${sortedParams}${body}${this.appSecret}`;
    return crypto.createHmac("sha256", this.appSecret).update(signString).digest("hex");
  }

  private buildParams(extra: Record<string, string> = {}): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, string> = {
      app_key: this.appKey,
      timestamp,
      ...extra,
    };
    return params;
  }

  private async request(method: string, path: string, data?: Record<string, unknown>, queryParams: Record<string, string> = {}) {
    const params = this.buildParams(queryParams);
    const bodyStr = data ? JSON.stringify(data) : "";
    const sign = this.generateSignature(path, params, bodyStr);

    const url = `${this.baseURL}${path}`;
    const response = await this.client.request({
      method,
      url,
      params: { ...params, sign, access_token: this.accessToken },
      data: data || undefined,
      headers: { "Content-Type": "application/json" },
    });

    if (response.data.code !== 0) {
      throw new Error(`TikTok API Error: ${response.data.message}`);
    }
    return response.data.data;
  }

  // ---- SHOP ----
  async getAuthorizedShops() {
    return this.request("GET", "/authorization/202309/shops");
  }

  // ---- PRODUCTS ----
  async getProducts(params: { page_size?: number; page_token?: string } = {}) {
    const queryParams: Record<string, string> = {
      shop_id: this.shopId,
      page_size: String(params.page_size || 100),
    };
    if (params.page_token) queryParams.page_token = params.page_token;
    return this.request("GET", "/product/202309/products", undefined, queryParams);
  }

  async getProduct(productId: string) {
    return this.request("GET", "/product/202309/products/" + productId, undefined, {
      shop_id: this.shopId,
    });
  }

  async createProduct(product: Record<string, unknown>) {
    return this.request("POST", "/product/202309/products", product, { shop_id: this.shopId });
  }

  async updateProduct(productId: string, product: Record<string, unknown>) {
    return this.request("PUT", `/product/202309/products/${productId}`, product, { shop_id: this.shopId });
  }

  async updateInventory(productId: string, skuId: string, quantity: number) {
    return this.request("PUT", `/product/202309/products/${productId}/skus`, {
      skus: [{ id: skuId, stock_infos: [{ warehouse_id: "", available_stock: quantity }] }],
    }, { shop_id: this.shopId });
  }

  // ---- ORDERS ----
  async getOrders(params: { order_status?: string; create_time_from?: number; create_time_to?: number; page_size?: number } = {}) {
    const queryParams: Record<string, string> = {
      shop_id: this.shopId,
      page_size: String(params.order_status || 50),
    };
    if (params.create_time_from) queryParams.create_time_from = String(params.create_time_from);
    if (params.create_time_to) queryParams.create_time_to = String(params.create_time_to);
    return this.request("GET", "/order/202309/orders", undefined, queryParams);
  }

  async getOrder(orderId: string) {
    return this.request("GET", `/order/202309/orders/${orderId}`, undefined, { shop_id: this.shopId });
  }

  async shipOrder(orderId: string, packageId: string, trackingNumber: string, shippingProvider: string) {
    return this.request("POST", `/fulfillment/202309/packages/${packageId}/ship`, {
      handover_method: "SEND_BY_SELLER",
      tracking_number: trackingNumber,
      shipping_provider_id: shippingProvider,
    }, { shop_id: this.shopId });
  }

  // ---- NORMALIZE ----
  normalizeProduct(tikTokProduct: Record<string, unknown>) {
    const skus = tikTokProduct.skus as Record<string, unknown>[] || [];
    return {
      externalId: tikTokProduct.id as string,
      name: tikTokProduct.title as string,
      description: tikTokProduct.description as string,
      category: (tikTokProduct.category_chains as Record<string, unknown>[])?.[0]?.local_name as string,
      images: ((tikTokProduct.main_images as Record<string, unknown>[]) || []).map((img) => img.urls as string[]).flat(),
      variants: skus.map((sku: Record<string, unknown>) => ({
        externalId: sku.id as string,
        sku: sku.seller_sku as string,
        name: ((sku.sales_attributes as Record<string, unknown>[]) || []).map((a: Record<string, unknown>) => a.value_name).join(" / "),
        price: parseFloat((sku.price as Record<string, unknown>)?.original_price as string || "0"),
        quantity: (sku.stock_infos as Record<string, unknown>[])?.[0]?.available_stock as number || 0,
      })),
    };
  }

  normalizeOrder(tikTokOrder: Record<string, unknown>) {
    const recipient = tikTokOrder.recipient_address as Record<string, unknown>;
    const lineItems = tikTokOrder.line_items as Record<string, unknown>[] || [];

    return {
      externalId: tikTokOrder.id as string,
      orderNumber: tikTokOrder.id as string,
      status: this.mapOrderStatus(tikTokOrder.status as string),
      customer: {
        name: recipient?.name as string,
        phone: recipient?.phone_number as string,
      },
      shippingAddress: {
        name: recipient?.name as string,
        address: recipient?.full_address as string,
        city: recipient?.city as string,
        state: recipient?.state as string,
        postcode: recipient?.zipcode as string,
        country: recipient?.region_code as string,
      },
      subtotal: parseFloat((tikTokOrder.payment as Record<string, unknown>)?.sub_total as string || "0"),
      shippingFee: parseFloat((tikTokOrder.payment as Record<string, unknown>)?.shipping_fee as string || "0"),
      discount: parseFloat((tikTokOrder.payment as Record<string, unknown>)?.seller_discount as string || "0"),
      total: parseFloat((tikTokOrder.payment as Record<string, unknown>)?.total_amount as string || "0"),
      items: lineItems.map((item: Record<string, unknown>) => ({
        externalId: item.id as string,
        name: item.product_name as string,
        sku: item.seller_sku as string,
        quantity: item.quantity as number,
        unitPrice: parseFloat(item.sale_price as string || "0"),
        total: parseFloat(item.sale_price as string || "0") * (item.quantity as number),
      })),
      placedAt: new Date((tikTokOrder.create_time as number) * 1000).toISOString(),
    };
  }

  private mapOrderStatus(status: string): string {
    const map: Record<string, string> = {
      UNPAID: "PENDING",
      ON_HOLD: "PENDING",
      AWAITING_SHIPMENT: "CONFIRMED",
      AWAITING_COLLECTION: "PROCESSING",
      IN_TRANSIT: "SHIPPED",
      DELIVERED: "DELIVERED",
      COMPLETED: "DELIVERED",
      CANCELLED: "CANCELLED",
    };
    return map[status] || "PENDING";
  }
}

export function createTikTokClient(credentials: TikTokCredentials) {
  return new TikTokClient(credentials);
}
