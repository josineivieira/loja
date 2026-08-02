export type ProductVariant = {
  id: string;
  sku: string;
  supplier_variant_id?: string | null;
  selected_options?: Record<string, string>;
  price: string;
  cost: string;
  stock: number;
  status: string;
  image_url?: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  sku: string;
  supplier_sku?: string | null;
  supplier_product_id?: string | null;
  cost_price?: string;
  sale_price: string;
  compare_at_price?: string | null;
  currency: string;
  status: string;
  featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
};

export type SupplierProductVariant = {
  supplier_variant_id: string;
  sku: string;
  name?: string | null;
  options?: Record<string, string>;
  price: string;
  cost: string;
  stock: number;
  image_url?: string | null;
};

export type SupplierProduct = {
  supplier_product_id: string;
  name: string;
  sku: string;
  description?: string | null;
  image_url?: string | null;
  images?: string[];
  variants: SupplierProductVariant[];
  raw?: Record<string, unknown>;
};

export type SupplierShippingEstimate = {
  code: string;
  name: string;
  amount: string;
  currency: string;
  min_days: number;
  max_days: number;
  tracking_available: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
};

export type ProductFilters = {
  category?: string;
  q?: string;
  min_price?: string;
  max_price?: string;
  availability?: "in_stock";
  featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  on_sale?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "bestsellers" | "rating" | "newest";
  limit?: number;
  offset?: number;
};
