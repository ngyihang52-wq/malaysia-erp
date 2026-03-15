/**
 * Lazada Malaysia Integration
 * Uses Lazada Open Platform API (LaOP)
 * Docs: https://open.lazada.com/apps/doc/api
 * Endpoint: https://api.lazada.com.my/rest
 */
import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

export interface LazadaCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  refreshToken?: string;
}

export class LazadaClient {
  private appKey: string;
  private appSecret: string;
  private accessToken: string;
  private baseURL = "https://api.lazada.com.my/rest";
  private client: AxiosInstance;

  constructor(credentials: LazadaCredentials) {
    this.appKey = credentials.appKey;
    this.appSecret = credentials.appSecret;
    this.accessToken = credentials.accessToken;

    this.client = axios.create({ baseURL: this.baseURL });
  }

  private generateSign(path: string, params: Record<string, string>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");

    const signStr = `${path}${sortedParams}`;
    return crypto.createHmac("sha256", this.appSecret).update(signStr).digest("hex").toUpperCase();
  }

  private buildParams(extra: Record<string, string> = {}): Record<string, string> {
    const timestamp = Date.now().toString();
    const params: Record<string, string> = {
      app_key: this.appKey,
      timestamp,
      sign_method: "sha256",
      access_token: this.accessToken,
      ...extra,
    };
    return params;
  }

  private async request(method: string, path: string, params: Record<string, string> = {}, body?: string) {
    const allParams = this.buildParams(params);
    const sign = this.generateSign(path, allParams);

    const response = await this.client.request({
      method,
      url: path,
      params: { ...allParams, sign },
      data: body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.data.code !== "0" && response.data.code !== 0) {
      throw new Error(`Lazada API Error [${response.data.code}]: ${response.data.message}`);
    }
    return response.data;
  }

  // ---- SELLER ----
  async getSellerInfo() {
    return this.request("GET", "/seller/get");
  }

  // ---- PRODUCTS ----
  async getProducts(params: { limit?: number; offset?: number; filter?: string; search?: string } = {}) {
    const queryParams: Record<string, string> = {
      limit: String(params.limit || 50),
      offset: String(params.offset || 0),
      filter: params.filter || "all",
    };
    if (params.search) queryParams.search = params.search;
    const res = await this.request("GET", "/products/get", queryParams);
    return res.data;
  }

  async getProduct(itemId: string) {
    const res = await this.request("GET", "/product/item/get", { item_id: itemId });
    return res.data;
  }

  async createProduct(xmlPayload: string) {
    const res = await this.request("POST", "/product/create", {}, `payload=${encodeURIComponent(xmlPayload)}`);
    return res.data;
  }

  async updateProduct(xmlPayload: string) {
    const res = await this.request("POST", "/product/update", {}, `payload=${encodeURIComponent(xmlPayload)}`);
    return res.data;
  }

  async updatePrice(skuId: string, price: string, salePrice?: string) {
    const skuPayload = JSON.stringify({
      Request: {
        Product: {
          Skus: {
            Sku: [{
              ItemId: skuId,
              SellerSku: skuId,
              price,
              ...(salePrice ? { special_price: salePrice } : {}),
            }],
          },
        },
      },
    });
    return this.request("POST", "/product/price/update", {}, `payload=${encodeURIComponent(skuPayload)}`);
  }

  async updateStock(sellerId: string, quantity: string) {
    const payload = JSON.stringify({
      Request: {
        Product: {
          Skus: {
            Sku: [{ SellerSku: sellerId, quantity }],
          },
        },
      },
    });
    return this.request("POST", "/product/stock/update", {}, `payload=${encodeURIComponent(payload)}`);
  }

  // ---- ORDERS ----
  async getOrders(params: {
    created_after?: string;
    created_before?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams: Record<string, string> = {
      limit: String(params.limit || 50),
      offset: String(params.offset || 0),
    };
    if (params.created_after) queryParams.created_after = params.created_after;
    if (params.created_before) queryParams.created_before = params.created_before;
    if (params.status) queryParams.status = params.status;

    const res = await this.request("GET", "/orders/get", queryParams);
    return res.data;
  }

  async getOrder(orderId: string) {
    const res = await this.request("GET", "/order/get", { order_id: orderId });
    return res.data;
  }

  async getOrderItems(orderId: string) {
    const res = await this.request("GET", "/order/items/get", { order_id: orderId });
    return res.data;
  }

  async setStatusToPackedByMarketplace(orderItemIds: number[]) {
    const res = await this.request("POST", "/order/pack", {
      order_item_ids: JSON.stringify(orderItemIds),
      shipping_provider: "Entrego",
    });
    return res.data;
  }

  async setStatusToReadyToShip(orderItemIds: number[], trackingNumber: string, shippingProvider: string) {
    const res = await this.request("POST", "/order/rts", {
      order_item_ids: JSON.stringify(orderItemIds),
      tracking_number: trackingNumber,
      shipping_provider: shippingProvider,
    });
    return res.data;
  }

  // ---- TOKEN REFRESH ----
  async refreshAccessToken(refreshToken: string) {
    const params = this.buildParams({ refresh_token: refreshToken });
    const sign = this.generateSign("/auth/token/refresh", params);
    const response = await this.client.get("/auth/token/refresh", {
      params: { ...params, sign },
    });
    return response.data;
  }

  // ---- NORMALIZE ----
  normalizeProduct(lazadaItem: Record<string, unknown>) {
    const skus = (lazadaItem.skus as Record<string, unknown>[]) || [];
    return {
      externalId: String(lazadaItem.item_id),
      name: (lazadaItem.attributes as Record<string, unknown>)?.name as string || lazadaItem.primary_category as string,
      description: (lazadaItem.attributes as Record<string, unknown>)?.description as string || "",
      category: String(lazadaItem.primary_category),
      images: ((lazadaItem.images as Record<string, unknown>[]) || []).map((img) => img.url as string),
      variants: skus.map((sku: Record<string, unknown>) => ({
        externalId: String(sku.SkuId),
        sku: sku.SellerSku as string,
        name: sku.name as string || "Default",
        price: parseFloat(sku.price as string || "0"),
        quantity: parseInt(sku.quantity as string || "0"),
      })),
    };
  }

  normalizeOrder(lazadaOrder: Record<string, unknown>) {
    const address = lazadaOrder.address_billing as Record<string, unknown> || {};

    return {
      externalId: String(lazadaOrder.order_id),
      orderNumber: String(lazadaOrder.order_number),
      status: this.mapOrderStatus(lazadaOrder.statuses as string[]),
      customer: {
        name: address.first_name as string + " " + address.last_name as string,
        phone: address.phone as string,
      },
      shippingAddress: {
        name: address.first_name as string + " " + address.last_name as string,
        address: address.address1 as string,
        city: address.city as string,
        state: "",
        postcode: address.post_code as string,
        country: address.country as string,
      },
      subtotal: parseFloat(lazadaOrder.price as string || "0"),
      shippingFee: 0,
      discount: 0,
      total: parseFloat(lazadaOrder.price as string || "0"),
      items: [],
      placedAt: lazadaOrder.created_at as string,
    };
  }

  private mapOrderStatus(statuses: string[]): string {
    if (!statuses || statuses.length === 0) return "PENDING";
    const status = statuses[0];
    const map: Record<string, string> = {
      unpaid: "PENDING",
      pending: "PENDING",
      ready_to_ship: "CONFIRMED",
      shipped: "SHIPPED",
      delivered: "DELIVERED",
      returned: "RETURNED",
      failed: "CANCELLED",
      canceled: "CANCELLED",
    };
    return map[status?.toLowerCase()] || "PENDING";
  }
}

export function createLazadaClient(credentials: LazadaCredentials) {
  return new LazadaClient(credentials);
}
