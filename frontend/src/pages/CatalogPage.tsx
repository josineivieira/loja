import { SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ProductCard } from "../components/ProductCard";
import { ProductSkeleton } from "../components/ProductSkeleton";
import { listCategories, listProducts } from "../services/catalogService";
import { usePreferencesStore } from "../stores/preferencesStore";
import type { Category, Product, ProductFilters } from "../types/catalog";
import { t } from "../utils/i18n";

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
  const language = usePreferencesStore((state) => state.language);

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

  const activeFilterCount = [filters.category, filters.min_price, filters.max_price, filters.availability, filters.on_sale, filters.is_new, filters.is_bestseller].filter(Boolean).length;

  return (
    <section className="store-shell py-8 sm:py-10">
      <div className="surface-card mb-6 overflow-hidden px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="pill-chip">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
              {activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : "Catálogo premium"}
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title === "Catalog" ? t("catalog", language) : title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              {language === "pt"
                ? "Visual de loja grande, navegação mais limpa e filtros preservando toda a mesma lógica do catálogo atual."
                : language === "es"
                  ? "Visual de gran tienda, navegacion mas limpia y filtros preservando la misma logica actual."
                  : "Big-store visual language, cleaner navigation and filters preserving the current catalog logic."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === "relevance" ? t("relevance", language) : option.label}
                </option>
              ))}
            </select>
            <button className="secondary-button !px-4 !py-2.5" onClick={() => { setPage(1); setSearchParams(new URLSearchParams()); }}>
              {language === "pt" ? "Limpar filtros" : language === "es" ? "Limpiar filtros" : "Clear filters"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[290px_1fr]">
        <aside className="surface-card h-fit p-5 xl:sticky xl:top-28">
          <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-950">
            <SlidersHorizontal className="h-4 w-4" />
            {t("filters", language)}
          </div>
          <label className="text-sm font-medium text-slate-700">{t("category", language)}</label>
          <select className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={filters.category ?? ""} onChange={(event) => updateFilter("category", event.target.value)}>
            <option value="">{t("allCategories", language)}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-slate-700">
              {t("min", language)}
              <input className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" inputMode="decimal" value={filters.min_price ?? ""} onChange={(event) => updateFilter("min_price", event.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("max", language)}
              <input className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" inputMode="decimal" value={filters.max_price ?? ""} onChange={(event) => updateFilter("max_price", event.target.value)} />
            </label>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
              <input type="checkbox" checked={filters.availability === "in_stock"} onChange={(event) => updateFilter("availability", event.target.checked ? "in_stock" : undefined)} />
              {t("inStock", language)}
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
              <input type="checkbox" checked={filters.on_sale === true} onChange={(event) => updateFilter("on_sale", event.target.checked)} />
              {t("promotions", language)}
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
              <input type="checkbox" checked={filters.is_new === true} onChange={(event) => updateFilter("is_new", event.target.checked)} />
              {t("newArrivals", language)}
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
              <input type="checkbox" checked={filters.is_bestseller === true} onChange={(event) => updateFilter("is_bestseller", event.target.checked)} />
              {t("bestSellers", language)}
            </label>
          </div>
        </aside>

        <div>
          {error ? <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-danger">{error}</div> : null}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="surface-card p-10 text-center text-slate-600">{t("noProducts", language)}</div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{products.length} produtos nesta página</p>
                <span className="pill-chip">Página {page}</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-8 flex justify-center gap-3">
                <button className="secondary-button !px-4 !py-2.5 disabled:opacity-50" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                  Previous
                </button>
                <span className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Page {page}</span>
                <button className="primary-button !px-4 !py-2.5 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={products.length < 12} onClick={() => setPage((value) => value + 1)}>
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
