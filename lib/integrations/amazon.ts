/**
 * Amazon Malaysia Integration
 * Uses Amazon Selling Partner API (SP-API)
 * Malaysia Marketplace ID: A15PK738MTTZSY
 * Endpoint: https://sellingpartnerapi-fe.amazon.com
 * Docs: https://developer-docs.amazon.com/sp-api
 */
import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

export interface AmazonCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  sellerId: string;
  marketplaceId?: string;
  endpoint?: string;
}

interface LWATokenResponse {
  access_token: string;
  expires_in: number;
}

export class AmazonClient {
  private credentials: AmazonCredentials;
  private marketplaceId: string;
  private endpoint: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private client: AxiosInstance;

  constructor(credentials: AmazonCredentials) {
    this.credentials = credentials;
    this.marketplaceId = credentials.marketplaceId || "A15PK738MTTZSY"; // Malaysia
    this.endpoint = credentials.endpoint || "https://sellingpartnerapi-fe.amazon.com";

    this.client = axios.create({ baseURL: this.endpoint });
  }

  // ---- LWA Authentication ----
  private async getLWAToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await axios.post<LWATokenResponse>("https://api.amazon.com/auth/o2/token", {
      grant_type: "refresh_token",
      refresh_token: this.credentials.refreshToken,
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
    }, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  // ---- AWS Signature V4 ----
  private sign(method: string, path: string, queryString: string, headers: Record<string, string>, body: string): Record<string, string> {
    const service = "execute-api";
    const region = "ap-southeast-1";
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 8);
    const datetimeStr = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";

    const canonicalHeaders = Object.keys(headers).sort().map((k) => `${k.toLowerCase()}:${headers[k]}\n`).join("");
    const signedHeaders = Object.keys(headers).sort().map((k) => k.toLowerCase()).join(";");
    const payloadHash = crypto.createHash("sha256").update(body).digest("hex");
    const canonicalRequest = [method, path, queryString, canonicalHeaders, signedHeaders, payloadHash].join("\n");

    const credentialScope = `${dateStr}/${region}/${service}/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", datetimeStr, credentialScope,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");

    const signingKey = [dateStr, region, service, "aws4_request"].reduce(
      (key, data) => crypto.createHmac("sha256", key).update(data).digest(),
      Buffer.from(`AWS4${this.credentials.secretAccessKey}`)
    );

    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    return {
      ...headers,
      "x-amz-date": datetimeStr,
      Authorization: `AWS4-HMAC-SHA256 Credential=${this.credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    };
  }

  private async request(method: string, path: string, params: Record<string, string> = {}, body?: Record<string, unknown>) {
    const accessToken = await this.getLWAToken();
    const queryString = new URLSearchParams(params).toString();
    const bodyStr = body ? JSON.stringify(body) : "";

    const headers: Record<string, string> = {
      "x-amz-access-token": accessToken,
      "x-amz-date": new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z",
      "content-type": "application/json",
      host: new URL(this.endpoint).host,
    };

    const signedHeaders = this.sign(method, path, queryString, headers, bodyStr);

    const response = await this.client.request({
      method,
      url: `${path}${queryString ? "?" + queryString : ""}`,
      headers: signedHeaders,
      data: bodyStr || undefined,
    });

    return response.data;
  }

  // ---- CATALOG ----
  async searchCatalogItems(query: string, params: Record<string, string> = {}) {
    return this.request("GET", "/catalog/2022-04-01/items", {
      keywords: query,
      marketplaceIds: this.marketplaceId,
      includedData: "summaries,attributes,images,productTypes,salesRanks",
      ...params,
    });
  }

  async getCatalogItem(asin: string) {
    return this.request("GET", `/catalog/2022-04-01/items/${asin}`, {
      marketplaceIds: this.marketplaceId,
      includedData: "summaries,attributes,images",
    });
  }

  // ---- LISTINGS ----
  async getListings(params: { pageSize?: number; pageToken?: string } = {}) {
    const queryParams: Record<string, string> = {
      sellerId: this.credentials.sellerId,
      marketplaceIds: this.marketplaceId,
      pageSize: String(params.pageSize || 50),
    };
    if (params.pageToken) queryParams.pageToken = params.pageToken;
    return this.request("GET", `/listings/2021-08-01/items/${this.credentials.sellerId}`, queryParams);
  }

  async getListing(sku: string) {
    return this.request("GET", `/listings/2021-08-01/items/${this.credentials.sellerId}/${sku}`, {
      marketplaceIds: this.marketplaceId,
      includedData: "summaries,attributes,issues,offers,fulfillmentAvailability,procurement",
    });
  }

  async putListing(sku: string, listing: Record<string, unknown>) {
    return this.request("PUT", `/listings/2021-08-01/items/${this.credentials.sellerId}/${sku}`, {
      marketplaceIds: this.marketplaceId,
    }, listing);
  }

  // ---- INVENTORY (FBA & FBM) ----
  async getFBAInventory(params: { details?: boolean; granularityType?: string; nextToken?: string } = {}) {
    const queryParams: Record<string, string> = {
      details: String(params.details || false),
      granularityType: params.granularityType || "Marketplace",
      granularityId: this.marketplaceId,
      marketplaceIds: this.marketplaceId,
    };
    if (params.nextToken) queryParams.nextToken = params.nextToken;
    return this.request("GET", "/fba/inventory/v1/summaries", queryParams);
  }

  // ---- ORDERS ----
  async getOrders(params: {
    createdAfter?: string;
    createdBefore?: string;
    orderStatuses?: string[];
    nextToken?: string;
    maxResultsPerPage?: number;
  } = {}) {
    const queryParams: Record<string, string> = {
      MarketplaceIds: this.marketplaceId,
      MaxResultsPerPage: String(params.maxResultsPerPage || 100),
    };
    if (params.createdAfter) queryParams.CreatedAfter = params.createdAfter;
    if (params.createdBefore) queryParams.CreatedBefore = params.createdBefore;
    if (params.orderStatuses) queryParams.OrderStatuses = params.orderStatuses.join(",");
    if (params.nextToken) queryParams.NextToken = params.nextToken;

    return this.request("GET", "/orders/v0/orders", queryParams);
  }

  async getOrder(orderId: string) {
    return this.request("GET", `/orders/v0/orders/${orderId}`);
  }

  async getOrderItems(orderId: string) {
    return this.request("GET", `/orders/v0/orders/${orderId}/orderItems`);
  }

  async confirmShipment(orderId: string, shipmentData: Record<string, unknown>) {
    return this.request("POST", `/orders/v0/orders/${orderId}/shipmentConfirmation`, {}, shipmentData);
  }

  // ---- REPORTS ----
  async createReport(reportType: string, params: Record<string, unknown> = {}) {
    return this.request("POST", "/reports/2021-06-30/reports", {}, {
      reportType,
      marketplaceIds: [this.marketplaceId],
      ...params,
    });
  }

  async getReport(reportId: string) {
    return this.request("GET", `/reports/2021-06-30/reports/${reportId}`);
  }

  // ---- NORMALIZE ----
  normalizeOrder(amazonOrder: Record<string, unknown>) {
    const address = amazonOrder.ShippingAddress as Record<string, unknown> || {};
    const buyer = amazonOrder.BuyerInfo as Record<string, unknown> || {};

    return {
      externalId: amazonOrder.AmazonOrderId as string,
      orderNumber: amazonOrder.AmazonOrderId as string,
      status: this.mapOrderStatus(amazonOrder.OrderStatus as string),
      customer: {
        name: buyer.BuyerName as string || address.Name as string,
        email: buyer.BuyerEmail as string,
      },
      shippingAddress: {
        name: address.Name as string,
        address: address.AddressLine1 as string,
        city: address.City as string,
        state: address.StateOrRegion as string,
        postcode: address.PostalCode as string,
        country: address.CountryCode as string,
      },
      subtotal: parseFloat((amazonOrder.OrderTotal as Record<string, unknown>)?.Amount as string || "0"),
      shippingFee: 0,
      discount: 0,
      total: parseFloat((amazonOrder.OrderTotal as Record<string, unknown>)?.Amount as string || "0"),
      items: [],
      placedAt: amazonOrder.PurchaseDate as string,
    };
  }

  private mapOrderStatus(status: string): string {
    const map: Record<string, string> = {
      Pending: "PENDING",
      Unshipped: "CONFIRMED",
      PartiallyShipped: "PROCESSING",
      Shipped: "SHIPPED",
      InvoiceUnconfirmed: "PROCESSING",
      Canceled: "CANCELLED",
      Unfulfillable: "CANCELLED",
    };
    return map[status] || "PENDING";
  }
}

export function createAmazonClient(credentials: AmazonCredentials) {
  return new AmazonClient(credentials);
}
