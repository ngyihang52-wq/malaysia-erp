/**
 * Shopee Malaysia Integration
 * Uses Shopee Open Platform API v2
 * Docs: https://open.shopee.com/documents
 * Malaysia Shop ID region
 */
import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

export interface ShopeeCredentials {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  accessToken: string;
  refreshToken?: string;
}

export class ShopeeClient {
  private partnerId: number;
  private partnerKey: string;
  private shopId: number;
  private accessToken: string;
  private baseURL = "https://partner.shopeemobile.com";
  private client: AxiosInstance;

  constructor(credentials: ShopeeCredentials) {
    this.partnerId = credentials.partnerId;
    this.partnerKey = credentials.partnerKey;
    this.shopId = credentials.shopId;
    this.accessToken = credentials.accessToken;

    this.client = axios.create({ baseURL: this.baseURL });
  }

  private getTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  private generateSign(path: string, timestamp: number): string {
    const baseStr = `${this.partnerId}${path}${timestamp}${this.accessToken}${this.shopId}`;
    return crypto.createHmac("sha256", this.partnerKey).update(baseStr).digest("hex");
  }

  private getCommonParams(path: string) {
    const timestamp = this.getTimestamp();
    return {
      partner_id: this.partnerId,
      timestamp,
      access_token: this.accessToken,
      shop_id: this.shopId,
      sign: this.generateSign(path, timestamp),
    };
  }

  private async get(path: string, params: Record<string, unknown> = {}) {
    const commonParams = this.getCommonParams(path);
    const response = await this.client.get(path, {
      params: { ...commonParams, ...params },
    });
    if (response.data.error) {
      throw new Error(`Shopee API Error: ${response.data.message}`);
    }
    return response.data.response;
  }

  private async post(path: string, data: Record<string, unknown> = {}) {
    const commonParams = this.getCommonParams(path);
    const response = await this.client.post(path, data, {
      params: commonParams,
    });
    if (response.data.error) {
      throw new Error(`Shopee API Error: ${response.data.message}`);
    }
    return response.data.response;
  }

  // ---- SHOP ----
  async getShopInfo() {
    return this.get("/api/v2/shop/get_shop_info");
  }

  // ---- PRODUCTS ----
  async getItemList(params: { offset?: number; page_size?: number; item_status?: string[] } = {}) {
    return this.get("/api/v2/product/get_item_list", {
      offset: params.offset || 0,
      page_size: params.page_size || 100,
      item_status: params.item_status?.join(",") || "NORMAL",
    });
  }

  async getItemDetail(itemIds: number[]) {
    return this.get("/api/v2/product/get_item_base_info", {
      item_id_list: itemIds.join(","),
    });
  }

  async getModelList(itemId: number) {
    return this.get("/api/v2/product/get_model_list", { item_id: itemId });
  }

  async updateStock(itemId: number, models: { model_id: number; normal_stock: number }[]) {
    return this.post("/api/v2/product/update_stock", {
      item_id: itemId,
      stock_list: models.map((m) => ({
        model_id: m.model_id,
        normal_stock: m.normal_stock,
      })),
    });
  }

  // ---- ORDERS ----
  async getOrderList(params: {
    time_range_field?: string;
    time_from?: number;
    time_to?: number;
    order_status?: string;
    page_size?: number;
    cursor?: string;
  } = {}) {
    const now = Math.floor(Date.now() / 1000);
    return this.get("/api/v2/order/get_order_list", {
      time_range_field: params.time_range_field || "create_time",
      time_from: params.time_from || now - 86400 * 30,
      time_to: params.time_to || now,
      order_status: params.order_status || "ALL",
      page_size: params.page_size || 50,
      cursor: params.cursor || "",
    });
  }

  async getOrderDetail(orderSns: string[]) {
    return this.get("/api/v2/order/get_order_detail", {
      order_sn_list: orderSns.join(","),
    });
  }

  async shipOrder(orderSn: string, packageNumber: string) {
    return this.post("/api/v2/logistics/ship_order", {
      order_sn: orderSn,
      package_number: packageNumber,
      pickup: {},
    });
  }

  async getTrackingNumber(orderSn: string, packageNumber?: string) {
    return this.get("/api/v2/logistics/get_tracking_number", {
      order_sn: orderSn,
      package_number: packageNumber || "",
    });
  }

  // ---- TOKEN REFRESH ----
  async refreshAccessToken(refreshToken: string) {
    const timestamp = this.getTimestamp();
    const path = "/api/v2/auth/access_token/get";
    const baseStr = `${this.partnerId}${path}${timestamp}`;
    const sign = crypto.createHmac("sha256", this.partnerKey).update(baseStr).digest("hex");

    const response = await this.client.post(path, {
      shop_id: this.shopId,
      partner_id: this.partnerId,
      refresh_token: refreshToken,
    }, {
      params: { partner_id: this.partnerId, timestamp, sign },
    });
    return response.data;
  }

  // ---- NORMALIZE ----
  normalizeProduct(shopeeItem: Record<string, unknown>) {
    return {
      externalId: String(shopeeItem.item_id),
      name: shopeeItem.item_name as string,
      description: shopeeItem.description as string,
      category: String(shopeeItem.category_id),
      images: ((shopeeItem.image as Record<string, unknown>)?.image_url_list as string[]) || [],
    };
  }

  normalizeOrder(shopeeOrder: Record<string, unknown>) {
    const items = shopeeOrder.item_list as Record<string, unknown>[] || [];
    const address = shopeeOrder.recipient_address as Record<string, unknown>;

    return {
      externalId: shopeeOrder.order_sn as string,
      orderNumber: shopeeOrder.order_sn as string,
      status: this.mapOrderStatus(shopeeOrder.order_status as string),
      customer: {
        name: address?.name as string,
        phone: address?.phone as string,
      },
      shippingAddress: {
        name: address?.name as string,
        address: address?.full_address as string,
        city: address?.city as string,
        state: address?.state as string,
        postcode: address?.zipcode as string,
        country: "MY",
      },
      subtotal: (shopeeOrder.total_amount as number) || 0,
      shippingFee: (shopeeOrder.actual_shipping_fee as number) || 0,
      discount: (shopeeOrder.voucher_from_seller as number) || 0,
      total: (shopeeOrder.total_amount as number) || 0,
      items: items.map((item: Record<string, unknown>) => ({
        externalId: String(item.item_id),
        name: item.item_name as string,
        sku: item.seller_sku as string,
        quantity: item.model_quantity_purchased as number,
        unitPrice: (item.model_discounted_price as number) || 0,
        total: ((item.model_discounted_price as number) || 0) * (item.model_quantity_purchased as number || 0),
      })),
      placedAt: new Date((shopeeOrder.create_time as number) * 1000).toISOString(),
    };
  }

  private mapOrderStatus(status: string): string {
    const map: Record<string, string> = {
      UNPAID: "PENDING",
      READY_TO_SHIP: "CONFIRMED",
      PROCESSED: "PROCESSING",
      SHIPPED: "SHIPPED",
      TO_CONFIRM_RECEIVE: "SHIPPED",
      IN_CANCEL: "CANCELLED",
      CANCELLED: "CANCELLED",
      COMPLETED: "DELIVERED",
      TO_RETURN: "RETURNED",
    };
    return map[status] || "PENDING";
  }
}

export function createShopeeClient(credentials: ShopeeCredentials) {
  return new ShopeeClient(credentials);
}
