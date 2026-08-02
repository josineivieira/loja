import { ArrowRight, BadgeDollarSign, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "../components/ProductCard";
import { Seo } from "../components/Seo";
import { listCategories, listProducts } from "../services/catalogService";
import { usePreferencesStore } from "../stores/preferencesStore";
import type { Category, Product } from "../types/catalog";
import { t } from "../utils/i18n";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const language = usePreferencesStore((state) => state.language);

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

  const heroProduct = bestSellers[0] ?? newArrivals[0];
  const heroImage = heroProduct?.images.find((image) => image.is_primary)?.url ?? heroProduct?.images[0]?.url;
  const heroTitle = useMemo(
    () =>
      language === "pt"
        ? "Uma vitrine premium, pronta para escalar sem mexer nas integrações"
        : language === "es"
          ? "Una vitrina premium lista para escalar sin tocar integraciones"
          : "A premium storefront built to scale without touching integrations",
    [language],
  );

  const trustCards = [
    {
      icon: Truck,
      title: t("internationalShipping", language),
      description: t("calculatedAtCheckout", language),
    },
    {
      icon: ShieldCheck,
      title: t("securePayments", language),
      description: t("stripeCheckout", language),
    },
    {
      icon: BadgeDollarSign,
      title: t("supplierReady", language),
      description: t("cjWorkflow", language),
    },
  ];

  return (
    <div className="pb-8">
      <Seo
        title="Nexora | Smart Gadgets. Smarter Living."
        description="Premium international smart gadgets with secure checkout and global shipping."
        jsonLd={{ "@context": "https://schema.org", "@type": "Organization", name: "Nexora", url: window.location.origin }}
      />

      <section className="store-shell pt-6 sm:pt-8">
        <div className="surface-card relative overflow-hidden px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_62%)] lg:block" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="pill-chip">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                {t("heroEyebrow", language)}
              </span>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">{heroTitle}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{t("heroCopy", language)}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/catalog" className="primary-button">
                  {t("shopNow", language)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link to="/checkout" className="secondary-button">
                  {language === "pt" ? "Ver checkout" : language === "es" ? "Ver checkout" : "See checkout"}
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  [language === "pt" ? "Layout premium" : language === "es" ? "Layout premium" : "Premium layout", language === "pt" ? "Mais foco em conversão" : language === "es" ? "Mas foco en conversion" : "Higher conversion focus"],
                  [language === "pt" ? "Checkout confiável" : language === "es" ? "Checkout confiable" : "Reliable checkout", language === "pt" ? "Fluxo preservado" : language === "es" ? "Flujo preservado" : "Flow preserved"],
                  [language === "pt" ? "Escala visual" : language === "es" ? "Escala visual" : "Visual scale", language === "pt" ? "Cara de loja grande" : language === "es" ? "Aspecto de gran tienda" : "Large-store feeling"],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-950">{title}</p>
                    <p className="mt-1 text-sm text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-10 hidden rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Storefront</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">UI aprimorada sem tocar APIs</p>
              </div>
              <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-primary p-4 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)] sm:p-5">
                <div className="overflow-hidden rounded-[26px] bg-white">
                  {heroImage ? (
                    <img className="aspect-[4/3] w-full object-cover" src={heroImage} alt={heroProduct?.name ?? "Nexora"} />
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8 text-center">
                      <div>
                        <p className="text-sm font-semibold text-primary">Nexora</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">Smart commerce ready</p>
                        <p className="mt-2 text-sm text-slate-600">Importe produtos CJ para destacar aqui automaticamente.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="store-shell py-8 sm:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {trustCards.map(({ icon: Icon, title, description }) => (
            <div key={title} className="soft-card rounded-[24px] px-5 py-5">
              <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="store-shell py-8 sm:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">{t("featuredCategories", language)}</h2>
            <p className="section-copy mt-2">{t("browseCollections", language)}</p>
          </div>
          <Link to="/catalog" className="text-sm font-semibold text-primary">
            {t("viewAll", language)}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {categories.slice(0, 3).map((category, index) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-5 py-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky-400 to-cyan-300" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">0{index + 1}</span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{category.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
                Explorar
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {bestSellers.length > 0 ? (
        <section className="store-shell py-8 sm:py-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">{t("bestSellers", language)}</h2>
              <p className="section-copy mt-2">Produtos com visual premium e CTA mais forte para compra rápida.</p>
            </div>
            <Link to="/catalog?is_bestseller=true" className="text-sm font-semibold text-primary">
              {t("viewAll", language)}
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {newArrivals.length > 0 ? (
        <section className="store-shell py-8 sm:py-10">
          <div className="surface-card px-5 py-7 sm:px-7 sm:py-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="section-title">{t("newArrivals", language)}</h2>
                <p className="section-copy mt-2">Novos produtos com apresentação mais forte para primeira impressão e retenção.</p>
              </div>
              <Link to="/catalog?is_new=true" className="text-sm font-semibold text-primary">
                {t("viewAll", language)}
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
