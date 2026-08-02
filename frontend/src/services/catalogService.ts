import { api } from "./api";
import { demoCategories, demoProducts } from "../data/demoCatalog";
import type { Category, Product, ProductFilters } from "../types/catalog";

const demoFallbackEnabled = import.meta.env.VITE_ENABLE_DEMO_FALLBACK !== "false";

function filterDemoProducts(filters: ProductFilters) {
  let products = [...demoProducts];
  if (filters.category) {
    const category = demoCategories.find((item) => item.slug === filters.category);
    if (category) {
      const categoryName = category.name.toLowerCase();
      products = products.filter((product) => product.name.toLowerCase().includes(categoryName.split(" ")[0]) || product.slug.includes(category.slug.split("-")[0]));
    }
  }
  if (filters.q) {
    const query = filters.q.toLowerCase();
    products = products.filter((product) => `${product.name} ${product.short_description} ${product.sku}`.toLowerCase().includes(query));
  }
  if (filters.min_price) products = products.filter((product) => Number(product.sale_price) >= Number(filters.min_price));
  if (filters.max_price) products = products.filter((product) => Number(product.sale_price) <= Number(filters.max_price));
  if (filters.availability === "in_stock") products = products.filter((product) => product.variants.some((variant) => variant.stock > 0));
  if (filters.on_sale) products = products.filter((product) => product.compare_at_price && Number(product.compare_at_price) > Number(product.sale_price));
  if (filters.is_new) products = products.filter((product) => product.is_new);
  if (filters.is_bestseller) products = products.filter((product) => product.is_bestseller);
  if (filters.sort === "price_asc") products.sort((a, b) => Number(a.sale_price) - Number(b.sale_price));
  if (filters.sort === "price_desc") products.sort((a, b) => Number(b.sale_price) - Number(a.sale_price));
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? products.length;
  return products.slice(offset, offset + limit);
}

export async function listCategories() {
  try {
    const { data } = await api.get<Category[]>("/categories");
    return data;
  } catch (error) {
    if (demoFallbackEnabled) return demoCategories;
    throw error;
  }
}

export async function listProducts(filters: ProductFilters = {}) {
  try {
    const { data } = await api.get<Product[]>("/products", { params: filters });
    return data;
  } catch (error) {
    if (demoFallbackEnabled) return filterDemoProducts(filters);
    throw error;
  }
}

export async function getProduct(slug: string) {
  try {
    const { data } = await api.get<Product>(`/products/${slug}`);
    return data;
  } catch (error) {
    const product = demoProducts.find((item) => item.slug === slug);
    if (demoFallbackEnabled && product) return product;
    throw error;
  }
}

export async function searchProducts(query: string) {
  try {
    const { data } = await api.get<Product[]>("/products/search", { params: { q: query } });
    return data;
  } catch (error) {
    if (demoFallbackEnabled) return filterDemoProducts({ q: query });
    throw error;
  }
}
