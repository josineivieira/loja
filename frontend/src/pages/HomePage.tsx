import { ArrowRight, ShieldCheck, Truck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "../components/ProductCard";
import { Seo } from "../components/Seo";
import { listCategories, listProducts } from "../services/catalogService";
import { usePreferencesStore } from "../stores/preferencesStore";
import type { Category, Product } from "../types/catalog";
import { t } from "../utils/i18n";

const spotlightCopy = {
  en: {
    title: "Storefront designed to feel premium from the first scroll to the last click.",
    text: "A sharper ecommerce direction with cleaner hierarchy, more trust signals and a more deliberate product discovery experience.",
    heroAction: "Explore catalog",
    secondaryAction: "See how checkout flows",
    editLine: "A more refined shopping experience",
    metrics: ["high-trust checkout", "clear product discovery", "supplier-ready structure"],
    selection: "Curated storefront sections",
    collectionText: "Present collections with the discipline and visual confidence of large retail brands.",
    journal: "Designed for brands that want more perceived value.",
  },
  pt: {
    title: "Uma vitrine desenhada para parecer premium do primeiro scroll ao último clique.",
    text: "Direção visual mais sofisticada, hierarquia mais limpa, mais sinais de confiança e uma navegação de produto muito mais madura.",
    heroAction: "Explorar catálogo",
    secondaryAction: "Ver fluxo do checkout",
    editLine: "Uma experiência de compra mais refinada",
    metrics: ["checkout com mais confiança", "descoberta de produtos mais clara", "estrutura pronta para fornecedor"],
    selection: "Seções pensadas para vender",
    collectionText: "Apresente coleções com a disciplina visual e a presença das grandes marcas do varejo.",
    journal: "Desenhado para lojas que querem aumentar valor percebido.",
  },
  es: {
    title: "Una vitrina pensada para sentirse premium desde el primer scroll hasta el último clic.",
    text: "Dirección visual más sofisticada, jerarquía más limpia, más señales de confianza y una experiencia de descubrimiento mucho más madura.",
    heroAction: "Explorar catálogo",
    secondaryAction: "Ver flujo del checkout",
    editLine: "Una experiencia de compra más refinada",
    metrics: ["checkout de alta confianza", "descubrimiento más claro", "estructura lista para proveedor"],
    selection: "Secciones pensadas para vender",
    collectionText: "Presenta colecciones con la disciplina visual y la presencia de las grandes marcas del retail.",
    journal: "Diseñado para tiendas que quieren elevar el valor percibido.",
  },
} as const;

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const language = usePreferencesStore((state) => state.language);
  const copy = spotlightCopy[language];

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

  return (
    <div>
      <Seo
        title="Nexora | Premium commerce storefront"
        description="Premium ecommerce storefront with secure checkout, stronger product presentation and a more polished purchasing journey."
        jsonLd={{ "@context": "https://schema.org", "@type": "Organization", name: "Nexora", url: window.location.origin }}
      />

      <section className="section-space pb-6">
        <div className="shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="panel surface-grid flex min-h-[620px] flex-col justify-between overflow-hidden p-8 md:p-12">
            <div>
              <p className="eyebrow">{copy.editLine}</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 md:text-lg">{copy.text}</p>
            </div>

            <div className="mt-10 space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {copy.metrics.map((metric) => (
                  <div key={metric} className="border border-slate-300 bg-white/80 p-4">
                    <p className="text-sm font-medium leading-6 text-slate-700">{metric}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/catalog" className="btn-primary">
                  {t("shopNow", language) === "shopNow" ? copy.heroAction : t("shopNow", language)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/checkout" className="btn-secondary">
                  {copy.secondaryAction}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="panel overflow-hidden bg-[#111827] p-6 text-white md:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-slate-300">Hero product</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                    {heroProduct?.name ?? "Nexora Collection"}
                  </h2>
                </div>
                <span className="badge-subtle border-white/20 bg-white/10 text-white">Premium edit</span>
              </div>

              <div className="grid gap-6 pt-6 md:grid-cols-[1fr_220px] md:items-center">
                <div>
                  <p className="text-sm leading-7 text-slate-300">
                    {heroProduct?.description ?? t("heroCopy", language)}
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                    {[
                      { icon: ShieldCheck, title: t("securePayments", language), copy: t("stripeCheckout", language) },
                      { icon: Truck, title: t("internationalShipping", language), copy: t("calculatedAtCheckout", language) },
                      { icon: Zap, title: t("supplierReady", language), copy: t("cjWorkflow", language) },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="border border-white/10 bg-white/5 p-4">
                          <Icon className="h-5 w-5 text-blue-200" />
                          <p className="mt-3 text-sm font-semibold">{item.title}</p>
                          <p className="mt-2 text-xs leading-6 text-slate-300">{item.copy}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-white/10 bg-white">
                  {heroImage ? (
                    <img className="aspect-[4/5] h-full w-full object-cover" src={heroImage} alt={heroProduct?.name ?? "Nexora"} />
                  ) : (
                    <div className="surface-grid aspect-[4/5] bg-[#f6f3ee]" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="panel-muted p-6 md:p-7">
                <p className="eyebrow">{copy.selection}</p>
                <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{copy.collectionText}</p>
              </div>
              <div className="panel p-6 md:p-7">
                <p className="eyebrow">Nexora note</p>
                <p className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{copy.journal}</p>
              </div>
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
                <p className="kicker-line">Nexora selection</p>
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
                <p className="kicker-line">Latest arrivals</p>
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
