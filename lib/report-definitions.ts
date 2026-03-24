/**
 * Report Builder — Column definitions and whitelists
 *
 * Every column exposed by the Report Builder must be defined here.
 * The API validates all requested columns against these definitions,
 * preventing raw SQL injection or unauthorized data access.
 */

export type ColumnType = "string" | "number" | "date" | "boolean" | "enum";

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  /** Prisma field path — e.g. "orderNumber" or "customer.name" */
  prismaField: string;
  /** If this column needs a Prisma `include` (e.g. "customer", "integration") */
  relation?: string;
  /** For enum-type filters */
  enumValues?: string[];
  /** If true, this column is computed server-side (not a direct Prisma field) */
  computed?: boolean;
}

export interface DataSourceDef {
  key: string;
  label: string;
  prismaModel: string;
  columns: ColumnDef[];
}

/* ─────────────────── DATA SOURCES ─────────────────── */

export const DATA_SOURCES: DataSourceDef[] = [
  {
    key: "orders",
    label: "Orders",
    prismaModel: "order",
    columns: [
      { key: "orderNumber", label: "Order Number", type: "string", prismaField: "orderNumber" },
      {
        key: "status", label: "Status", type: "enum", prismaField: "status",
        enumValues: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"],
      },
      {
        key: "paymentStatus", label: "Payment Status", type: "enum", prismaField: "paymentStatus",
        enumValues: ["PENDING", "PAID", "PARTIAL", "REFUNDED", "FAILED"],
      },
      {
        key: "fulfillmentStatus", label: "Fulfillment", type: "enum", prismaField: "fulfillmentStatus",
        enumValues: ["UNFULFILLED", "PARTIAL", "FULFILLED", "RETURNED"],
      },
      { key: "customerName", label: "Customer Name", type: "string", prismaField: "customer.name", relation: "customer" },
      { key: "platform", label: "Platform", type: "string", prismaField: "integration.platform", relation: "integration" },
      { key: "subtotal", label: "Subtotal", type: "number", prismaField: "subtotal" },
      { key: "shippingFee", label: "Shipping", type: "number", prismaField: "shippingFee" },
      { key: "discount", label: "Discount", type: "number", prismaField: "discount" },
      { key: "tax", label: "Tax", type: "number", prismaField: "tax" },
      { key: "total", label: "Total", type: "number", prismaField: "total" },
      { key: "currency", label: "Currency", type: "string", prismaField: "currency" },
      { key: "placedAt", label: "Placed Date", type: "date", prismaField: "placedAt" },
      { key: "shippedAt", label: "Shipped Date", type: "date", prismaField: "shippedAt" },
      { key: "deliveredAt", label: "Delivered Date", type: "date", prismaField: "deliveredAt" },
    ],
  },
  {
    key: "products",
    label: "Products",
    prismaModel: "product",
    columns: [
      { key: "sku", label: "SKU", type: "string", prismaField: "sku" },
      { key: "name", label: "Name", type: "string", prismaField: "name" },
      { key: "category", label: "Category", type: "string", prismaField: "category" },
      { key: "brand", label: "Brand", type: "string", prismaField: "brand" },
      { key: "costPrice", label: "Cost Price", type: "number", prismaField: "costPrice" },
      { key: "isActive", label: "Active", type: "boolean", prismaField: "isActive" },
      { key: "totalStock", label: "Total Stock", type: "number", prismaField: "", computed: true },
      { key: "channelCount", label: "Channel Count", type: "number", prismaField: "", computed: true },
      { key: "createdAt", label: "Created Date", type: "date", prismaField: "createdAt" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    prismaModel: "customer",
    columns: [
      { key: "name", label: "Name", type: "string", prismaField: "name" },
      { key: "email", label: "Email", type: "string", prismaField: "email" },
      { key: "phone", label: "Phone", type: "string", prismaField: "phone" },
      { key: "city", label: "City", type: "string", prismaField: "city" },
      { key: "state", label: "State", type: "string", prismaField: "state" },
      { key: "country", label: "Country", type: "string", prismaField: "country" },
      {
        key: "platform", label: "Platform", type: "enum", prismaField: "platform",
        enumValues: ["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"],
      },
      { key: "totalOrders", label: "Total Orders", type: "number", prismaField: "totalOrders" },
      { key: "totalSpent", label: "Total Spent", type: "number", prismaField: "totalSpent" },
      { key: "createdAt", label: "Joined Date", type: "date", prismaField: "createdAt" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    prismaModel: "inventoryItem",
    columns: [
      { key: "productName", label: "Product Name", type: "string", prismaField: "product.name", relation: "product" },
      { key: "productSku", label: "SKU", type: "string", prismaField: "product.sku", relation: "product" },
      { key: "warehouseName", label: "Warehouse", type: "string", prismaField: "warehouse.name", relation: "warehouse" },
      { key: "quantity", label: "Quantity", type: "number", prismaField: "quantity" },
      { key: "reservedQty", label: "Reserved", type: "number", prismaField: "reservedQty" },
      { key: "reorderPoint", label: "Reorder Point", type: "number", prismaField: "reorderPoint" },
      { key: "reorderQty", label: "Reorder Qty", type: "number", prismaField: "reorderQty" },
      { key: "available", label: "Available", type: "number", prismaField: "", computed: true },
    ],
  },
];

/* ─────────────────── HELPERS ─────────────────── */

export function getSourceDef(sourceKey: string): DataSourceDef | undefined {
  return DATA_SOURCES.find((s) => s.key === sourceKey);
}

export function validateColumns(sourceKey: string, columns: string[]): boolean {
  const source = getSourceDef(sourceKey);
  if (!source) return false;
  const validKeys = new Set(source.columns.map((c) => c.key));
  return columns.every((col) => validKeys.has(col));
}

export function getColumnDef(sourceKey: string, columnKey: string): ColumnDef | undefined {
  const source = getSourceDef(sourceKey);
  return source?.columns.find((c) => c.key === columnKey);
}
