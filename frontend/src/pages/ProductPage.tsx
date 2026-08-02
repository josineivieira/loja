import { Check, Heart, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { QuantityStepper } from "../components/QuantityStepper";
import { Seo } from "../components/Seo";
import { getProduct } from "../services/catalogService";
import { estimateShipping } from "../services/checkoutService";
import { listProductReviews } from "../services/engagementService";
import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import type { Product, ProductVariant } from "../types/catalog";
import type { ShippingQuote } from "../types/checkout";
import type { Review } from "../types/engagement";
import { formatMoney } from "../utils/currency";
import { t } from "../utils/i18n";
import { productDisplayDescription, productDisplayName, variantDisplayOptions, variantOptionSummary } from "../utils/productPresentation";

export function ProductPage() {
  const { slug } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const displayCurrency = usePreferencesStore((state) => state.currency);
  const language = usePreferencesStore((state) => state.language);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const hasFavorite = useFavoritesStore((state) => state.has);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({ country: "BR", postal_code: "", state: "", city: "" });
  const [deliveryQuotes, setDeliveryQuotes] = useState<ShippingQuote[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [deliveryVariantIds, setDeliveryVariantIds] = useState<string[]>([]);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [showAllVariants, setShowAllVariants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getProduct(slug)
      .then((data) => {
        setProduct(data);
        setSelectedVariant(data.variants[0] ?? null);
        setActiveImage(data.images.find((image) => image.is_primary)?.url ?? data.images[0]?.url ?? null);
        listProductReviews(data.id).then(setReviews);
      })
      .catch(() => setError("Product not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  const maxStock = selectedVariant?.stock ?? 0;
  const canBuy = Boolean(product && selectedVariant && maxStock >= quantity);
  const compareAt = product?.compare_at_price ? Number(product.compare_at_price) : null;
  const displayPrice = useMemo(() => Number(selectedVariant?.price ?? product?.sale_price ?? 0), [product, selectedVariant]);
  const displayName = product ? productDisplayName(product, language) : "";
  const displayDescription = product ? productDisplayDescription(product, language) : "";
  const visibleVariants = product ? (showAllVariants ? product.variants : product.variants.slice(0, 8)) : [];
  const optionGroups = useMemo(() => {
    if (!product) return [];
    const groups = new Map<string, string[]>();
    product.variants.forEach((variant, index) => {
      Object.entries(variantDisplayOptions(product, variant, index, language)).forEach(([name, value]) => {
        if (!value) return;
        groups.set(name, Array.from(new Set([...(groups.get(name) ?? []), value])));
      });
    });
    return Array.from(groups.entries()).filter(([, values]) => values.length > 0);
  }, [language, product]);

  function handleAddToCart() {
    if (!product || !selectedVariant) return;
    addItem({
      productId: product.id,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantSku: selectedVariant.sku,
      name: displayName,
      imageUrl: activeImage,
      currency: product.currency,
      unitPrice: displayPrice,
      quantity,
    });
  }

  function handleFavorite() {
    if (!product) return;
    toggleFavorite({
      productId: product.id,
      productSlug: product.slug,
      name: displayName,
      imageUrl: activeImage,
      currency: product.currency,
      price: displayPrice,
    });
  }

  function selectVariant(variant: ProductVariant) {
    setSelectedVariant(variant);
    if (variant.image_url) setActiveImage(variant.image_url);
  }

  function selectOption(optionName: string, optionValue: string) {
    if (!product || !selectedVariant) return;
    const selectedIndex = product.variants.indexOf(selectedVariant);
    const currentOptions = variantDisplayOptions(product, selectedVariant, Math.max(0, selectedIndex), language);
    const desired = { ...currentOptions, [optionName]: optionValue };
    const match = product.variants.find((variant, index) => {
      const options = variantDisplayOptions(product, variant, index, language);
      return Object.entries(desired).every(([name, value]) => !value || options[name] === value);
    });
    if (match) selectVariant(match);
  }

  useEffect(() => {
    const digits = deliveryForm.postal_code.replace(/\D/g, "");
    if (deliveryForm.country.toUpperCase() !== "BR" || digits.length !== 8) return;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setDeliveryForm((value) => ({ ...value, state: data.uf ?? value.state, city: data.localidade ?? value.city }));
        }
      } catch {
        // fallback manual
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [deliveryForm.country, deliveryForm.postal_code]);

  async function checkDelivery() {
    if (!selectedVariant || !product) return;
    setCheckingDelivery(true);
    setDeliveryStatus(null);
    setDeliveryQuotes([]);
    setDeliveryVariantIds([]);
    try {
      const quotes = await estimateShipping({
        variant_id: selectedVariant.id,
        quantity,
        country: deliveryForm.country,
        state: deliveryForm.state,
        city: deliveryForm.city,
        postal_code: deliveryForm.postal_code,
        currency: product.currency,
      });
      setDeliveryQuotes(quotes);
      setDeliveryVariantIds([selectedVariant.id]);
      setDeliveryStatus(quotes.length ? t("deliveryAvailable", language) : t("deliveryUnavailable", language));
    } catch (error) {
      const available = [] as Array<{ variant: ProductVariant; quotes: ShippingQuote[] }>;
      for (const variant of product.variants.filter((item) => item.id !== selectedVariant.id)) {
        try {
          const quotes = await estimateShipping({
            variant_id: variant.id,
            quantity,
            country: deliveryForm.country,
            state: deliveryForm.state,
            city: deliveryForm.city,
            postal_code: deliveryForm.postal_code,
            currency: product.currency,
          });
          if (quotes.length) available.push({ variant, quotes });
        } catch {
          // ignore per-variant errors
        }
      }
      if (available.length) {
        selectVariant(available[0].variant);
        setDeliveryQuotes(available[0].quotes);
        setDeliveryVariantIds(available.map((item) => item.variant.id));
        setDeliveryStatus(t("selectedVariantUnavailable", language));
      } else {
        setDeliveryStatus(error instanceof Error ? error.message : t("deliveryUnavailable", language));
      }
    } finally {
      setCheckingDelivery(false);
    }
  }

  if (loading) {
    return <div className="shell py-20 text-sm text-slate-600">{language === "pt" ? "Carregando produto..." : language === "es" ? "Cargando producto..." : "Loading product..."}</div>;
  }

  if (error || !product) {
    return <div className="shell py-20 text-sm text-danger">{error}</div>;
  }

  return (
    <section className="section-space">
      <Seo
        title={`${displayName} | Nexora`}
        description={displayDescription}
        canonicalPath={`/product/${product.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: displayName,
          sku: product.sku,
          description: displayDescription,
          image: activeImage ? [activeImage] : [],
          offers: {
            "@type": "Offer",
            price: displayPrice,
            priceCurrency: product.currency,
            availability: maxStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }}
      />

      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-4">
            <div className="panel overflow-hidden bg-[#f7f4ee]">
              {activeImage ? <img className="aspect-[4/4.8] h-full w-full object-cover" src={activeImage} alt={displayName} /> : <div className="aspect-[4/4.8] surface-grid" />}
            </div>
            {product.images.length > 1 ? (
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((image) => (
                  <button
                    key={image.id}
                    className={`overflow-hidden border bg-white ${activeImage === image.url ? "border-slate-950" : "border-slate-200"}`}
                    onClick={() => setActiveImage(image.url)}
                  >
                    <img className="aspect-square h-full w-full object-cover" src={image.url} alt={image.alt_text ?? displayName} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel overflow-hidden bg-white">
            <div className="border-b border-slate-200 px-6 py-5 md:px-8">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                <span>{product.currency}</span>
                <span>{product.sku}</span>
                {product.is_bestseller ? <span className="badge-subtle">Best seller</span> : null}
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 md:text-5xl">{displayName}</h1>
              <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">{displayDescription}</p>
            </div>

            <div className="space-y-8 px-6 py-6 md:px-8 md:py-8">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Price</p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-4xl font-semibold tracking-[-0.05em] text-slate-950">{formatMoney(displayPrice, product.currency, displayCurrency)}</p>
                    {compareAt ? <p className="pb-1 text-base text-slate-400 line-through">{formatMoney(compareAt, product.currency, displayCurrency)}</p> : null}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-slate-950">{maxStock > 0 ? `${maxStock} ${t("inStockCount", language)}` : t("outOfStock", language)}</p>
                  <p className="mt-1 text-slate-500">{selectedVariant?.sku ?? product.sku}</p>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{t("model", language)}</p>
                  {product.variants.length > 8 ? (
                    <button className="text-sm font-semibold text-slate-700 transition hover:text-slate-950" onClick={() => setShowAllVariants((value) => !value)}>
                      {showAllVariants
                        ? language === "pt"
                          ? "Ver menos"
                          : language === "es"
                            ? "Ver menos"
                            : "Show less"
                        : `${language === "pt" ? "Ver mais opções" : language === "es" ? "Ver más opciones" : "Show more options"} (${product.variants.length})`}
                    </button>
                  ) : null}
                </div>

                {optionGroups.length ? (
                  <div className="space-y-5">
                    {optionGroups.map(([name, values]) => {
                      const selectedIndex = selectedVariant ? product.variants.indexOf(selectedVariant) : 0;
                      const selectedOptions = selectedVariant ? variantDisplayOptions(product, selectedVariant, Math.max(0, selectedIndex), language) : {};
                      return (
                        <div key={name}>
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {values.map((value) => {
                              const active = selectedOptions[name] === value;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  className={`border px-4 py-2.5 text-sm font-semibold transition ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-950"}`}
                                  onClick={() => selectOption(name, value)}
                                >
                                  {value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {!optionGroups.length || showAllVariants ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {visibleVariants.map((variant) => {
                      const option = variantOptionSummary(product, variant, product.variants.indexOf(variant), language);
                      return (
                        <button
                          key={variant.id}
                          className={`grid grid-cols-[56px_1fr] gap-3 border p-3 text-left transition ${selectedVariant?.id === variant.id ? "border-slate-950 bg-[#f6f4ee]" : "border-slate-200 bg-white hover:border-slate-300"}`}
                          onClick={() => selectVariant(variant)}
                        >
                          <span className="overflow-hidden border border-slate-200 bg-[#f3efe8]">
                            {variant.image_url ? <img src={variant.image_url} alt="" className="aspect-square h-full w-full object-cover" /> : <span className="block aspect-square" />}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-950">{option.title}</span>
                            <span className="mt-1 block text-xs text-slate-500">{option.detail}</span>
                            <span className="mt-2 block text-xs uppercase tracking-[0.18em] text-slate-400">{variant.sku}</span>
                            <span className="mt-2 block text-sm text-slate-600">{variant.stock > 0 ? `${variant.stock} ${t("inStockCount", language)}` : t("outOfStock", language)}</span>
                            {deliveryVariantIds.includes(variant.id) ? <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check className="h-3.5 w-3.5" />Entrega nesse CEP</span> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
                <QuantityStepper value={quantity} max={Math.max(1, maxStock)} onChange={setQuantity} />
                <button className="btn-primary h-12 px-6 disabled:border-slate-300 disabled:bg-slate-300" disabled={!canBuy} onClick={handleAddToCart}>
                  <ShoppingBag className="h-4 w-4" />
                  {t("addToCart", language)}
                </button>
                <button className="btn-secondary h-12 px-4" onClick={handleFavorite}>
                  <Heart className={`h-4 w-4 ${hasFavorite(product.id) ? "fill-current" : ""}`} />
                  {hasFavorite(product.id) ? t("saved", language) : t("favorite", language)}
                </button>
              </div>

              {!canBuy ? (
                <p className="text-sm text-red-600">
                  {language === "pt"
                    ? "Selecione uma opção disponível antes de adicionar ao carrinho."
                    : language === "es"
                      ? "Selecciona una opción disponible antes de añadir al carrito."
                      : "Select an available option before adding this product to the cart."}
                </p>
              ) : null}

              <section className="panel-muted p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-slate-900" />
                  <h2 className="text-lg font-semibold text-slate-950">{t("checkDelivery", language)}</h2>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[88px_1fr_1fr_1fr_auto]">
                  <input className="input-clean" placeholder={t("country", language)} value={deliveryForm.country} onChange={(event) => setDeliveryForm({ ...deliveryForm, country: event.target.value.toUpperCase() })} maxLength={2} />
                  <input className="input-clean" placeholder={t("postalCode", language)} value={deliveryForm.postal_code} onChange={(event) => setDeliveryForm({ ...deliveryForm, postal_code: event.target.value })} />
                  <input className="input-clean" placeholder={t("state", language)} value={deliveryForm.state} onChange={(event) => setDeliveryForm({ ...deliveryForm, state: event.target.value })} />
                  <input className="input-clean" placeholder={t("city", language)} value={deliveryForm.city} onChange={(event) => setDeliveryForm({ ...deliveryForm, city: event.target.value })} />
                  <button className="btn-primary h-12 px-5 disabled:border-slate-300 disabled:bg-slate-300" disabled={checkingDelivery || !selectedVariant || !deliveryForm.postal_code || !deliveryForm.state || !deliveryForm.city} onClick={checkDelivery}>
                    {checkingDelivery ? (language === "pt" ? "Verificando..." : language === "es" ? "Verificando..." : "Checking...") : (language === "pt" ? "Verificar" : language === "es" ? "Verificar" : "Check")}
                  </button>
                </div>

                {deliveryStatus ? <p className={`mt-4 text-sm ${deliveryQuotes.length ? "text-emerald-700" : "text-red-600"}`}>{deliveryStatus}</p> : null}

                {deliveryQuotes.length ? (
                  <div className="mt-4 grid gap-3">
                    {deliveryQuotes.slice(0, 3).map((quote) => (
                      <div key={quote.code} className="flex items-center justify-between gap-4 border border-slate-200 bg-white p-4 text-sm">
                        <span>
                          <span className="block font-semibold text-slate-950">{quote.name}</span>
                          <span className="mt-1 block text-slate-600">{quote.min_days}-{quote.max_days} dias úteis</span>
                        </span>
                        <span className="font-semibold text-slate-950">{formatMoney(Number(quote.amount), quote.currency, displayCurrency)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                {[
                  { icon: Truck, title: t("internationalShippingCard", language), text: t("deliveryEstimateCheckout", language) },
                  { icon: ShieldCheck, title: t("secureCheckoutCard", language), text: t("paymentTrusted", language) },
                  { icon: ShoppingBag, title: t("easyReturnsCard", language), text: t("returnsGlobal", language) },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="border border-slate-200 bg-[#f8f6f1] p-4">
                      <Icon className="h-5 w-5 text-slate-900" />
                      <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="panel p-6 md:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{t("description", language)}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">{displayDescription}</p>
          </div>

          <div className="panel p-6 md:p-8">
            <h2 className="text-lg font-semibold text-slate-950">{t("specifications", language)}</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-slate-500">{t("currency", language)}</dt>
                <dd className="font-medium text-slate-950">{product.currency}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <dt className="text-slate-500">{t("status", language)}</dt>
                <dd className="font-medium text-slate-950">{product.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">SKU</dt>
                <dd className="font-medium text-slate-950">{selectedVariant?.sku ?? product.sku}</dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="kicker-line">Customer voice</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{t("customerReviews", language)}</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.length === 0 ? (
              <div className="panel p-6 text-sm text-slate-600">{t("noReviews", language)}</div>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className="panel p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{review.title ?? "Review"}</h3>
                    <span className="badge-subtle border-slate-900 text-slate-900">{review.rating}/5</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">{review.customer_name}{review.verified_purchase ? " · Verified purchase" : ""}</p>
                  {review.admin_reply ? <p className="mt-4 border border-slate-200 bg-[#f8f6f1] p-4 text-sm leading-6 text-slate-600">{review.admin_reply}</p> : null}
                </article>
              ))
            )}
          </div>
        </section>

        <Link to="/catalog" className="mt-10 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 transition hover:text-slate-950">
          {t("backToCatalog", language)}
        </Link>
      </div>
    </section>
  );
}
