import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

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

  return (
    <section className="section-space">
      <div className="shell">
        <div className="panel mb-8 overflow-hidden">
          <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="eyebrow">{language === "pt" ? "Produtos selecionados" : language === "es" ? "Productos seleccionados" : "Selected products"}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
                {title === "Catalog" ? t("catalog", language) : title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                {language === "pt"
                  ? "Encontre produtos úteis para casa, viagem, trabalho e rotina. Use os filtros para ajustar categoria, preço e disponibilidade."
                  : language === "es"
                    ? "Encuentra productos útiles para casa, viajes, trabajo y rutina. Usa los filtros para ajustar categoría, precio y disponibilidad."
                    : "Find useful products for home, travel, work and everyday routines. Use filters to refine category, price and availability."}
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                language === "pt" ? "Compra segura" : language === "es" ? "Compra segura" : "Secure checkout",
                language === "pt" ? "Frete por endereço" : language === "es" ? "Envío por dirección" : "Address-based delivery",
                language === "pt" ? "Produtos com estoque" : language === "es" ? "Productos con stock" : "In-stock products",
              ].map((item) => (
                <div key={item} className="border border-slate-200 bg-[#f8f6f1] p-4">{item}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
          <aside className="panel h-fit overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-[0.18em]">{t("filters", language)}</span>
            </div>
            <div className="space-y-6 p-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("category", language)}</label>
                <select className="select-clean mt-3" value={filters.category ?? ""} onChange={(event) => updateFilter("category", event.target.value)}>
                  <option value="">{t("allCategories", language)}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t("min", language)}
                  <input className="input-clean mt-3" inputMode="decimal" value={filters.min_price ?? ""} onChange={(event) => updateFilter("min_price", event.target.value)} />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t("max", language)}
                  <input className="input-clean mt-3" inputMode="decimal" value={filters.max_price ?? ""} onChange={(event) => updateFilter("max_price", event.target.value)} />
                </label>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-700">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={filters.availability === "in_stock"} onChange={(event) => updateFilter("availability", event.target.checked ? "in_stock" : undefined)} />
                  {t("inStock", language)}
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={filters.on_sale === true} onChange={(event) => updateFilter("on_sale", event.target.checked)} />
                  {t("promotions", language)}
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={filters.is_new === true} onChange={(event) => updateFilter("is_new", event.target.checked)} />
                  {t("newArrivals", language)}
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={filters.is_bestseller === true} onChange={(event) => updateFilter("is_bestseller", event.target.checked)} />
                  {t("bestSellers", language)}
                </label>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">
                {language === "pt"
                  ? `${products.length} itens selecionados para esta vitrine`
                  : language === "es"
                    ? `${products.length} artículos seleccionados para esta vitrina`
                    : `${products.length} items selected for this storefront`}
              </div>
              <select className="select-clean max-w-[240px]" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === "relevance" ? t("relevance", language) : option.label}
                  </option>
                ))}
              </select>
            </div>

            {error ? <div className="mb-6 border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div> : null}

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="panel p-10 text-center text-slate-600">{t("noProducts", language)}</div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button className="btn-secondary px-4 py-2.5 disabled:border-slate-200 disabled:text-slate-300" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                    {language === "pt" ? "Anterior" : language === "es" ? "Anterior" : "Previous"}
                  </button>
                  <span className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">{language === "pt" ? "Página" : language === "es" ? "Página" : "Page"} {page}</span>
                  <button className="btn-primary px-4 py-2.5 disabled:border-slate-300 disabled:bg-slate-300" disabled={products.length < 12} onClick={() => setPage((value) => value + 1)}>
                    {language === "pt" ? "Próxima" : language === "es" ? "Siguiente" : "Next"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-8 text-center text-sm text-slate-500">
                  <Link to="/checkout" className="font-semibold text-slate-700 underline underline-offset-4 transition hover:text-slate-950">
                    {language === "pt" ? "Ir para o carrinho" : language === "es" ? "Ir al carrito" : "Go to cart"}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
