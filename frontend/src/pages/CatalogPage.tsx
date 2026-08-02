import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ProductCard } from "../components/ProductCard";
import { ProductSkeleton } from "../components/ProductSkeleton";
import { listCategories, listProducts } from "../services/catalogService";
import type { Category, Product, ProductFilters } from "../types/catalog";

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
  { value: "bestsellers", label: "Best sellers" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
] as const;

type CatalogPageProps = {
  categorySlug?: string;
  searchQuery?: string;
  title?: string;
};

export function CatalogPage({ categorySlug, searchQuery, title = "Catalog" }: CatalogPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filters = useMemo<ProductFilters>(() => {
    const params: ProductFilters = {
      category: categorySlug ?? searchParams.get("category") ?? undefined,
      q: searchQuery ?? searchParams.get("q") ?? undefined,
      min_price: searchParams.get("min_price") ?? undefined,
      max_price: searchParams.get("max_price") ?? undefined,
      availability: searchParams.get("availability") === "in_stock" ? "in_stock" : undefined,
      on_sale: searchParams.get("on_sale") === "true" || undefined,
      is_new: searchParams.get("is_new") === "true" || undefined,
      is_bestseller: searchParams.get("is_bestseller") === "true" || undefined,
      sort: (searchParams.get("sort") as ProductFilters["sort"]) ?? "relevance",
      limit: 12,
      offset: (page - 1) * 12,
    };
    return params;
  }, [categorySlug, page, searchParams, searchQuery]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([listProducts(filters), listCategories()])
      .then(([productData, categoryData]) => {
        setProducts(productData);
        setCategories(categoryData);
      })
      .catch(() => setError("Unable to load products."))
      .finally(() => setLoading(false));
  }, [filters]);

  function updateFilter(key: string, value: string | boolean | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === "" || value === false) next.delete(key);
    else next.set(key, String(value));
    setPage(1);
    setSearchParams(next);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">Filter international smart gadgets by category, price and availability.</p>
        </div>
        <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>
          <label className="text-sm font-medium">Category</label>
          <select className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" value={filters.category ?? ""} onChange={(event) => updateFilter("category", event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Min
              <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" inputMode="decimal" value={filters.min_price ?? ""} onChange={(event) => updateFilter("min_price", event.target.value)} />
            </label>
            <label className="text-sm font-medium">
              Max
              <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" inputMode="decimal" value={filters.max_price ?? ""} onChange={(event) => updateFilter("max_price", event.target.value)} />
            </label>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={filters.availability === "in_stock"} onChange={(event) => updateFilter("availability", event.target.checked ? "in_stock" : undefined)} />
              In stock
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={filters.on_sale === true} onChange={(event) => updateFilter("on_sale", event.target.checked)} />
              Promotions
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={filters.is_new === true} onChange={(event) => updateFilter("is_new", event.target.checked)} />
              New arrivals
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={filters.is_bestseller === true} onChange={(event) => updateFilter("is_bestseller", event.target.checked)} />
              Best sellers
            </label>
          </div>
        </aside>

        <div>
          {error ? <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-danger">{error}</div> : null}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-8 text-center text-slate-600">No products match these filters.</div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-8 flex justify-center gap-3">
                <button className="rounded-md border border-slate-200 px-4 py-2 text-sm disabled:text-slate-300" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                  Previous
                </button>
                <span className="rounded-md bg-mist px-4 py-2 text-sm">Page {page}</span>
                <button className="rounded-md border border-slate-200 px-4 py-2 text-sm disabled:text-slate-300" disabled={products.length < 12} onClick={() => setPage((value) => value + 1)}>
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

