import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number | string, currency = "MYR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MY-${timestamp}-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    SHOPIFY: "#96BF48",
    TIKTOK: "#010101",
    SHOPEE: "#EE4D2D",
    LAZADA: "#0F146D",
    AMAZON: "#FF9900",
  };
  return colors[platform] || "#6B7280";
}

export function getPlatformBadgeClass(platform: string): string {
  const classes: Record<string, string> = {
    SHOPIFY: "bg-green-100 text-green-800",
    TIKTOK: "bg-gray-900 text-white",
    SHOPEE: "bg-orange-100 text-orange-800",
    LAZADA: "bg-blue-100 text-blue-900",
    AMAZON: "bg-yellow-100 text-yellow-800",
  };
  return classes[platform] || "bg-gray-100 text-gray-800";
}

export function getOrderStatusClass(status: string): string {
  const classes: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    RETURNED: "bg-orange-100 text-orange-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}

export function apiResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}
