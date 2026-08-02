export type ProductVariant = {
  id: string;
  sku: string;
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
