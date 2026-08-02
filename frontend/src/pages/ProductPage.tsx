import { Heart, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
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
import { productDisplayDescription, productDisplayName, variantOptionSummary } from "../utils/productPresentation";

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
        // Delivery can still be checked manually if ViaCEP is unavailable.
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
      const available = [];
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
          // Some supplier variants can be unavailable for the destination while others are valid.
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

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-12 text-slate-600">{language === "pt" ? "Carregando produto..." : language === "es" ? "Cargando producto..." : "Loading product..."}</div>;
  if (error || !product) return <div className="mx-auto max-w-7xl px-4 py-12 text-danger">{error}</div>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
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
          offers: { "@type": "Offer", price: displayPrice, priceCurrency: product.currency, availability: maxStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
        }}
      />
      <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-mist">
            {activeImage ? <img className="h-full w-full object-cover" src={activeImage} alt={displayName} /> : <div className="grid h-full place-items-center text-slate-500">Nexora</div>}
          </div>
          {product.images.length > 1 ? (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {product.images.map((image) => (
                <button key={image.id} className={`aspect-square overflow-hidden rounded-md border ${activeImage === image.url ? "border-primary" : "border-slate-200"}`} onClick={() => setActiveImage(image.url)}>
                  <img className="h-full w-full object-cover" src={image.url} alt={image.alt_text ?? displayName} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase text-primary">{product.sku}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{displayName}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{displayDescription}</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-semibold">{formatMoney(displayPrice, product.currency, displayCurrency)}</p>
            {compareAt ? <p className="pb-1 text-slate-500 line-through">{formatMoney(compareAt, product.currency, displayCurrency)}</p> : null}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{t("model", language)}</p>
              {product.variants.length > 8 ? (
                <button className="text-sm font-semibold text-primary" onClick={() => setShowAllVariants((value) => !value)}>
                  {showAllVariants ? (language === "pt" ? "Ver menos" : language === "es" ? "Ver menos" : "Show less") : `${language === "pt" ? "Ver todas" : language === "es" ? "Ver todas" : "Show all"} (${product.variants.length})`}
                </button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {visibleVariants.map((variant) => {
                const option = variantOptionSummary(product, variant, product.variants.indexOf(variant), language);
                return (
                  <button key={variant.id} className={`grid grid-cols-[48px_1fr] gap-3 rounded-md border p-3 text-left text-sm ${selectedVariant?.id === variant.id ? "border-primary bg-blue-50" : "border-slate-200"}`} onClick={() => selectVariant(variant)}>
                    <span className="h-12 w-12 overflow-hidden rounded-md bg-mist">
                      {variant.image_url ? <img src={variant.image_url} alt="" className="h-full w-full object-cover" /> : null}
                    </span>
                    <span>
                      <span className="block font-semibold">{option.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">{option.detail}</span>
                      <span className="mt-1 block text-xs text-slate-500">{variant.sku}</span>
                      <span className="mt-1 block text-slate-600">{variant.stock > 0 ? `${variant.stock} ${t("inStockCount", language)}` : t("outOfStock", language)}</span>
                      {deliveryVariantIds.includes(variant.id) ? <span className="mt-1 block text-xs font-semibold text-emerald-700">Entrega nesse CEP</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            {product.variants.some((variant) => !variant.selected_options || Object.keys(variant.selected_options).length === 0) ? (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {language === "pt"
                  ? "Algumas variantes antigas ainda nao vieram com cor e tamanho do fornecedor. Para pedidos novos, importe pela CJ novamente ou edite no admin para salvar as opcoes reais."
                  : language === "es"
                    ? "Algunas variantes antiguas aun no tienen color y talla del proveedor. Para nuevos productos, importa desde CJ nuevamente o edita en admin."
                    : "Some older variants do not have supplier color and size saved yet. For new products, import from CJ again or edit them in admin."}
              </p>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} max={Math.max(1, maxStock)} onChange={setQuantity} />
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!canBuy} onClick={handleAddToCart}>
              <ShoppingBag className="h-4 w-4" />
              {t("addToCart", language)}
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold hover:bg-mist" onClick={handleFavorite}>
              <Heart className="h-4 w-4" />
              {hasFavorite(product.id) ? t("saved", language) : t("favorite", language)}
            </button>
          </div>
          {!canBuy ? <p className="mt-3 text-sm text-danger">{language === "pt" ? "Selecione uma opcao disponivel antes de adicionar ao carrinho." : language === "es" ? "Selecciona una opcion disponible antes de anadir al carrito." : "Select an available option before adding this product to the cart."}</p> : null}

          <section className="mt-8 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t("checkDelivery", language)}</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[88px_1fr_1fr_1fr_auto]">
              <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder={t("country", language)} value={deliveryForm.country} onChange={(event) => setDeliveryForm({ ...deliveryForm, country: event.target.value.toUpperCase() })} maxLength={2} />
              <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder={t("postalCode", language)} value={deliveryForm.postal_code} onChange={(event) => setDeliveryForm({ ...deliveryForm, postal_code: event.target.value })} />
              <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder={t("state", language)} value={deliveryForm.state} onChange={(event) => setDeliveryForm({ ...deliveryForm, state: event.target.value })} />
              <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder={t("city", language)} value={deliveryForm.city} onChange={(event) => setDeliveryForm({ ...deliveryForm, city: event.target.value })} />
              <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300" disabled={checkingDelivery || !selectedVariant || !deliveryForm.postal_code || !deliveryForm.state || !deliveryForm.city} onClick={checkDelivery}>
                {checkingDelivery ? (language === "pt" ? "Verificando..." : language === "es" ? "Verificando..." : "Checking...") : (language === "pt" ? "Verificar" : language === "es" ? "Verificar" : "Check")}
              </button>
            </div>
            {deliveryStatus ? <p className={`mt-3 text-sm ${deliveryQuotes.length ? "text-emerald-700" : "text-danger"}`}>{deliveryStatus}</p> : null}
            {deliveryQuotes.length ? (
              <div className="mt-3 grid gap-2">
                {deliveryQuotes.slice(0, 3).map((quote) => (
                  <div key={quote.code} className="flex items-center justify-between rounded-md bg-mist p-3 text-sm">
                    <span>
                      <span className="block font-semibold">{quote.name}</span>
                      <span className="text-slate-600">{quote.min_days}-{quote.max_days} dias uteis</span>
                    </span>
                    <span className="font-semibold">{formatMoney(Number(quote.amount), quote.currency, displayCurrency)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <Truck className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">{t("internationalShippingCard", language)}</p>
              <p className="mt-1 text-slate-600">{t("deliveryEstimateCheckout", language)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">{t("secureCheckoutCard", language)}</p>
              <p className="mt-1 text-slate-600">{t("paymentTrusted", language)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">{t("easyReturnsCard", language)}</p>
              <p className="mt-1 text-slate-600">{t("returnsGlobal", language)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-semibold">{t("description", language)}</h2>
          <p className="mt-3 max-w-3xl leading-8 text-slate-600">{displayDescription}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-5">
          <h2 className="text-base font-semibold">{t("specifications", language)}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t("currency", language)}</dt>
              <dd>{product.currency}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t("status", language)}</dt>
              <dd>{product.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">SKU</dt>
              <dd>{selectedVariant?.sku ?? product.sku}</dd>
            </div>
          </dl>
        </div>
      </div>
      <section className="mt-12">
        <h2 className="text-xl font-semibold">{t("customerReviews", language)}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {reviews.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-5 text-sm text-slate-600">{t("noReviews", language)}</div>
          ) : (
            reviews.map((review) => (
              <article key={review.id} className="rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{review.title ?? "Review"}</h3>
                  <span className="text-sm font-semibold text-primary">{review.rating}/5</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                <p className="mt-3 text-xs text-slate-500">{review.customer_name}{review.verified_purchase ? " · Verified purchase" : ""}</p>
                {review.admin_reply ? <p className="mt-3 rounded-md bg-mist p-3 text-sm text-slate-600">{review.admin_reply}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
      <Link to="/catalog" className="mt-10 inline-flex text-sm font-semibold text-primary">
        {t("backToCatalog", language)}
      </Link>
    </section>
  );
}
