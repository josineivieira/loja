import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "../components/ProductCard";
import { Seo } from "../components/Seo";
import { listCategories, listProducts } from "../services/catalogService";
import { usePreferencesStore } from "../stores/preferencesStore";
import type { Category, Product } from "../types/catalog";
import { formatMoney } from "../utils/currency";
import { t } from "../utils/i18n";
import { productDisplayDescription, productDisplayName } from "../utils/productPresentation";

const homeCopy = {
  en: {
    title: "Smart finds for home, travel and everyday comfort.",
    text: "Discover useful products with secure checkout, international delivery and clear prices before you buy.",
    eyebrow: "Selected products for your routine",
    catalog: "View products",
    newArrivals: "New arrivals",
    featured: "Featured today",
    from: "From",
    shopNow: "Shop now",
    benefits: ["Secure payment", "Delivery calculated by address", "Tracking when available"],
    departments: "Popular departments",
    departmentsText: "Browse practical products for smart homes, trips, workspaces and daily use.",
    note: "New products are added as supplier availability is confirmed.",
    selection: "Nexora selection",
    latest: "Latest arrivals",
  },
  pt: {
    title: "Achados inteligentes para casa, viagem e rotina.",
    text: "Produtos úteis com compra segura, entrega internacional e preço claro antes de finalizar o pedido.",
    eyebrow: "Selecionados para facilitar seu dia",
    catalog: "Ver produtos",
    newArrivals: "Novidades",
    featured: "Destaque de hoje",
    from: "A partir de",
    shopNow: "Comprar agora",
    benefits: ["Pagamento seguro", "Frete calculado pelo endereço", "Rastreamento quando disponível"],
    departments: "Departamentos populares",
    departmentsText: "Encontre itens práticos para casa inteligente, viagens, trabalho e uso diário.",
    note: "Novos produtos entram na loja conforme disponibilidade confirmada no fornecedor.",
    selection: "Seleção Nexora",
    latest: "Novidades",
  },
  es: {
    title: "Hallazgos inteligentes para casa, viajes y rutina.",
    text: "Productos útiles con compra segura, entrega internacional y precio claro antes de finalizar.",
    eyebrow: "Seleccionados para tu día a día",
    catalog: "Ver productos",
    newArrivals: "Novedades",
    featured: "Destacado de hoy",
    from: "Desde",
    shopNow: "Comprar ahora",
    benefits: ["Pago seguro", "Envío calculado por dirección", "Rastreo cuando esté disponible"],
    departments: "Departamentos populares",
    departmentsText: "Encuentra productos prácticos para casa inteligente, viajes, trabajo y uso diario.",
    note: "Nuevos productos se agregan según disponibilidad confirmada por el proveedor.",
    selection: "Selección Nexora",
    latest: "Novedades",
  },
} as const;

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const language = usePreferencesStore((state) => state.language);
  const displayCurrency = usePreferencesStore((state) => state.currency);
  const copy = homeCopy[language];

  useEffect(() => {
    Promise.all([
      listCategories(),
      listProducts({ is_bestseller: true, limit: 4, sort: "bestsellers" }),
      listProducts({ is_new: true, limit: 4, sort: "newest" }),
    ]).then(([categoryData, bestsellerData, newData]) => {
      setCategories(categoryData);
      setBestSellers(bestsellerData);
      setNewArrivals(newData);
    });
  }, []);

  const heroProduct = useMemo(() => bestSellers[0] ?? newArrivals[0], [bestSellers, newArrivals]);
  const heroImage = heroProduct?.images.find((image) => image.is_primary)?.url ?? heroProduct?.images[0]?.url;
  const heroName = heroProduct ? productDisplayName(heroProduct, language) : "Nexora";
  const heroDescription = heroProduct ? productDisplayDescription(heroProduct, language) : copy.text;

  return (
    <div>
      <Seo
        title="Nexora | Loja online de produtos úteis"
        description="Produtos úteis para casa, viagem e rotina com checkout seguro e entrega internacional calculada por endereço."
        jsonLd={{ "@context": "https://schema.org", "@type": "Organization", name: "Nexora", url: window.location.origin }}
      />

      <section className="section-space pb-6">
        <div className="shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="flex min-h-[560px] flex-col justify-between bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.08)] md:p-10">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-6xl">{copy.title}</h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 md:text-lg">{copy.text}</p>
            </div>

            <div className="mt-10 space-y-8">
              <div className="grid gap-3 sm:grid-cols-3">
                {copy.benefits.map((benefit) => (
                  <div key={benefit} className="border border-slate-200 bg-[#faf8f4] p-4">
                    <p className="text-sm font-medium leading-6 text-slate-700">{benefit}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/catalog" className="btn-primary">
                  {copy.catalog}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/catalog?is_new=true" className="btn-secondary">
                  {copy.newArrivals}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="overflow-hidden bg-[#111827] text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)]">
              <div className="grid min-h-[560px] md:grid-cols-[1fr_0.95fr]">
                <div className="flex flex-col justify-between p-7 md:p-9">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.26em] text-blue-100">{copy.featured}</p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{heroName}</h2>
                    <p className="mt-5 text-sm leading-7 text-slate-300">{heroDescription}</p>
                  </div>

                  <div className="mt-8">
                    {heroProduct ? (
                      <p className="text-sm text-slate-300">
                        {copy.from} <span className="text-2xl font-semibold text-white">{formatMoney(Number(heroProduct.sale_price), heroProduct.currency, displayCurrency)}</span>
                      </p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link to={heroProduct ? `/product/${heroProduct.slug}` : "/catalog"} className="btn-primary border-white bg-white text-slate-950 hover:bg-slate-100">
                        {copy.shopNow}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link to="/catalog" className="inline-flex items-center justify-center border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                        {copy.catalog}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5">
                  {heroImage ? (
                    <img className="h-full min-h-[420px] w-full object-cover" src={heroImage} alt={heroName} />
                  ) : (
                    <div className="surface-grid h-full min-h-[420px] bg-[#f6f3ee]" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: ShieldCheck, title: copy.benefits[0] },
                { icon: Truck, title: copy.benefits[1] },
                { icon: Sparkles, title: copy.benefits[2] },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">{item.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section-space pt-4">
        <div className="shell">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="panel-muted p-6 md:p-7">
              <p className="eyebrow">{copy.departments}</p>
              <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{copy.departmentsText}</p>
            </div>
            <div className="panel p-6 md:p-7">
              <p className="eyebrow">Nexora</p>
              <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{copy.note}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space pt-4">
        <div className="shell">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="kicker-line">{t("featuredCategories", language)}</p>
              <h2 className="mt-4 headline-md">{t("featuredCategories", language)}</h2>
            </div>
            <Link to="/catalog" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
              {t("viewAll", language)}
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {categories.slice(0, 3).map((category, index) => (
              <Link key={category.id} to={`/category/${category.slug}`} className="panel group overflow-hidden">
                <div className="border-b border-slate-200 p-6 md:p-7">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">0{index + 1}</span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950 transition group-hover:translate-x-1">{category.name}</h3>
                </div>
                <div className="bg-[#f8f6f1] p-6 md:p-7">
                  <p className="text-sm leading-7 text-slate-600">{category.description || t("browseCollections", language)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {bestSellers.length > 0 ? (
        <section className="section-space pt-6">
          <div className="shell">
            <div className="mb-8 flex items-end justify-between gap-5">
              <div>
                <p className="kicker-line">{copy.selection}</p>
                <h2 className="mt-4 headline-md">{t("bestSellers", language)}</h2>
              </div>
              <Link to="/catalog?sort=bestsellers" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                {t("viewAll", language)}
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {newArrivals.length > 0 ? (
        <section className="section-space bg-[#ece7de]">
          <div className="shell">
            <div className="mb-8 flex items-end justify-between gap-5">
              <div>
                <p className="kicker-line">{copy.latest}</p>
                <h2 className="mt-4 headline-md">{t("newArrivals", language)}</h2>
              </div>
              <Link to="/catalog?is_new=true" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                {t("viewAll", language)}
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
