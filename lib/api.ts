export type Product = {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  category: string;
  sizes: string[];
  stock: Record<string, number>;
  colorway: string;
  material: string;
  description: string;
  images: string[];
  sold: number;
  rating: number;
  reviews: number;
  published: boolean;
};

export type ProductInput = {
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  category: string;
  material: string;
  colorway: string;
  sizes: { size: string; stock: number }[];
  images: string[];
  published?: boolean;
};

export type OrderPayload = {
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  paymentMethod: "transfer" | "cod" | "ewallet";
  expectedSubtotal?: number;
  items: { slug: string; size: string; qty: number }[];
};

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";

export type OrderResult = {
  orderNumber: string;
  status: OrderStatus;
  allowedStatuses: OrderStatus[];
  customerName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  items: { name: string; price: number; size: string; qty: number }[];
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type AuthResult = { token: string; user: User };

export type Result<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown; raw?: File } = {}
): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      cache: "no-store",
      headers: {
        ...(options.raw
          ? { "Content-Type": options.raw.type }
          : options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.raw ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    });
    if (res.status === 204) return { ok: true, data: undefined as T };
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Terjadi kesalahan.", status: res.status };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server. Pastikan backend berjalan." };
  }
}

export async function getProducts(params?: {
  search?: string;
  category?: string;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  const qs = query.toString();

  const res = await request<Product[]>(`/api/products${qs ? `?${qs}` : ""}`);
  return res.ok ? res.data : [];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const res = await request<Product>(`/api/products/${slug}`);
  return res.ok ? res.data : null;
}

export function createOrder(payload: OrderPayload, token?: string | null) {
  return request<OrderResult>("/api/orders", { method: "POST", body: payload, token });
}

export type TrackedOrder = Omit<OrderResult, "phone" | "address" | "postalCode" | "allowedStatuses">;

export function trackOrder(body: { orderNumber: string; phone: string }) {
  return request<TrackedOrder>("/api/orders/track", { method: "POST", body });
}

export function cancelMyOrder(token: string, orderNumber: string) {
  return request<OrderResult>(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: "POST", token });
}

export function updateProfile(token: string, name: string) {
  return request<User>("/api/auth/me", { method: "PATCH", token, body: { name } });
}

export function changePassword(token: string, body: { currentPassword: string; newPassword: string }) {
  return request<{ ok: true }>("/api/auth/password", { method: "POST", token, body });
}

export function adminResetPassword(token: string, id: number) {
  return request<{ email: string; temporaryPassword: string }>(`/api/admin/users/${id}/reset-password`, {
    method: "POST",
    token,
  });
}

export type ReviewsData = {
  average: number;
  count: number;
  canReview: boolean;
  mine: { rating: number; comment: string; hidden: boolean } | null;
  reviews: { id: number; name: string; rating: number; comment: string; createdAt: string }[];
};

export function getReviews(slug: string, token?: string | null) {
  return request<ReviewsData>(`/api/products/${encodeURIComponent(slug)}/reviews`, { token });
}

export function postReview(token: string, slug: string, body: { rating: number; comment: string }) {
  return request<{ id: number }>(`/api/products/${encodeURIComponent(slug)}/reviews`, { method: "POST", token, body });
}

export function getWishlist(token: string) {
  return request<Product[]>("/api/wishlist", { token });
}

export function addToWishlist(token: string, slug: string) {
  return request<void>(`/api/wishlist/${encodeURIComponent(slug)}`, { method: "PUT", token });
}

export function removeFromWishlist(token: string, slug: string) {
  return request<void>(`/api/wishlist/${encodeURIComponent(slug)}`, { method: "DELETE", token });
}

export type AdminReview = {
  id: number;
  product: string;
  slug: string;
  customer: string;
  email: string;
  rating: number;
  comment: string;
  hidden: boolean;
  createdAt: string;
};

export function getAdminReviews(token: string) {
  return request<AdminReview[]>("/api/admin/reviews", { token });
}

export function setReviewHidden(token: string, id: number, hidden: boolean) {
  return request<{ id: number; hidden: boolean }>(`/api/admin/reviews/${id}`, { method: "PATCH", token, body: { hidden } });
}

export function deleteReview(token: string, id: number) {
  return request<void>(`/api/admin/reviews/${id}`, { method: "DELETE", token });
}

export function getShopSettings() {
  return request<{ whatsappNumber: string }>("/api/settings");
}

export function getAdminSettings(token: string) {
  return request<{ whatsappNumber: string }>("/api/admin/settings", { token });
}

export function saveAdminSettings(token: string, body: { whatsappNumber: string }) {
  return request<{ whatsappNumber: string }>("/api/admin/settings", { method: "PUT", token, body });
}

export function registerUser(body: { name: string; email: string; password: string }) {
  return request<AuthResult>("/api/auth/register", { method: "POST", body });
}

export function loginUser(body: { email: string; password: string }) {
  return request<AuthResult>("/api/auth/login", { method: "POST", body });
}

export function adminLogin(body: { email: string; password: string }) {
  return request<AuthResult>("/api/admin/auth/login", { method: "POST", body });
}

export function getAdminMe(token: string) {
  return request<User>("/api/admin/auth/me", { token });
}

export function getCurrentUser(token: string) {
  return request<User>("/api/auth/me", { token });
}

export function getMyOrders(token: string) {
  return request<OrderResult[]>("/api/orders/mine", { token });
}

export type OrdersPage = {
  orders: OrderResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<OrderStatus, number>;
};

export function getAdminOrders(
  token: string,
  params: { status?: OrderStatus; q?: string; page?: number; pageSize?: number } = {}
) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  return request<OrdersPage>(`/api/orders${qs ? `?${qs}` : ""}`, { token });
}

export type AdminStats = {
  totals: {
    orders: number;
    needsAction: number;
    revenue: number;
    customers: number;
    products: number;
    outOfStock: number;
  };
  byStatus: Record<OrderStatus, number>;
  lowStock: { product: string; slug: string; size: string; stock: number; published: boolean }[];
  lowStockThreshold: number;
};

export function getAdminStats(token: string) {
  return request<AdminStats>("/api/admin/stats", { token });
}

export type RangeKey = "1d" | "7d" | "1m" | "3m" | "6m" | "9m" | "1y";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "1d", label: "1 hari" },
  { key: "7d", label: "1 minggu" },
  { key: "1m", label: "1 bulan" },
  { key: "3m", label: "3 bulan" },
  { key: "6m", label: "6 bulan" },
  { key: "9m", label: "9 bulan" },
  { key: "1y", label: "1 tahun" },
];

export type Granularity = "hour" | "day" | "week" | "month";

export type SalesReport = {
  range: RangeKey;
  granularity: Granularity;
  from: string;
  buckets: { start: string; revenue: number; orders: number }[];
  summary: {
    revenue: number;
    orders: number;
    averageOrder: number;
    itemsSold: number;
    cancelled: number;
    previousRevenue: number;
    previousOrders: number;
    revenueChange: number | null;
    ordersChange: number | null;
  };
  byStatus: Record<OrderStatus, number>;
  topProducts: { name: string; qty: number; revenue: number }[];
};

export function getSalesReport(token: string, range: RangeKey) {
  return request<SalesReport>(`/api/admin/reports/sales?range=${range}`, { token });
}

/** Downloads the sales report as a CSV file (browser only). */
export async function downloadSalesCsv(token: string, range: RangeKey): Promise<Result<null>> {
  try {
    const res = await fetch(`${API_URL}/api/admin/reports/sales.csv?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error ?? "Gagal mengunduh laporan.", status: res.status };
    }
    const filename =
      /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? `laporan-penjualan-${range}.csv`;
    const url = URL.createObjectURL(await res.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server. Pastikan backend berjalan." };
  }
}

export function getAdminProducts(token: string) {
  return request<Product[]>("/api/admin/products", { token });
}

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  orders: number;
  totalSpent: number;
};

export function getAdminUsers(token: string, q?: string) {
  return request<AdminUser[]>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`, { token });
}

export function setUserActive(token: string, id: number, active: boolean) {
  return request<{ id: number; active: boolean }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    token,
    body: { active },
  });
}

export function uploadImage(token: string, file: File) {
  return request<{ id: string; url: string }>("/api/admin/uploads", { method: "POST", token, raw: file });
}

export function updateOrderStatus(token: string, orderNumber: string, status: OrderStatus) {
  return request<OrderResult>(`/api/orders/${orderNumber}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

export function createProduct(token: string, body: ProductInput) {
  return request<Product>("/api/products", { method: "POST", token, body });
}

export function updateProduct(token: string, slug: string, body: Partial<ProductInput>) {
  return request<Product>(`/api/products/${slug}`, { method: "PUT", token, body });
}

export function deleteProduct(token: string, slug: string) {
  return request<void>(`/api/products/${slug}`, { method: "DELETE", token });
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
