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

export function ProductPage() {
  const { slug } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const displayCurrency = usePreferencesStore((state) => state.currency);
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
  const [checkingDelivery, setCheckingDelivery] = useState(false);
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

  function handleAddToCart() {
    if (!product || !selectedVariant) return;
    addItem({
      productId: product.id,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantSku: selectedVariant.sku,
      name: product.name,
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
      name: product.name,
      imageUrl: activeImage,
      currency: product.currency,
      price: displayPrice,
    });
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
      setDeliveryStatus(quotes.length ? "Entrega disponivel para este destino." : "Ainda nao temos entrega disponivel para este destino.");
    } catch {
      setDeliveryStatus("Ainda nao temos entrega disponivel para este destino.");
    } finally {
      setCheckingDelivery(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-12 text-slate-600">Loading product...</div>;
  if (error || !product) return <div className="mx-auto max-w-7xl px-4 py-12 text-danger">{error}</div>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <Seo
        title={`${product.name} | Nexora`}
        description={product.short_description ?? "Nexora smart gadget."}
        canonicalPath={`/product/${product.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: product.sku,
          description: product.short_description,
          image: activeImage ? [activeImage] : [],
          offers: { "@type": "Offer", price: displayPrice, priceCurrency: product.currency, availability: maxStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
        }}
      />
      <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-mist">
            {activeImage ? <img className="h-full w-full object-cover" src={activeImage} alt={product.name} /> : <div className="grid h-full place-items-center text-slate-500">Nexora</div>}
          </div>
          {product.images.length > 1 ? (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {product.images.map((image) => (
                <button key={image.id} className={`aspect-square overflow-hidden rounded-md border ${activeImage === image.url ? "border-primary" : "border-slate-200"}`} onClick={() => setActiveImage(image.url)}>
                  <img className="h-full w-full object-cover" src={image.url} alt={image.alt_text ?? product.name} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase text-primary">{product.sku}</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{product.name}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{product.short_description}</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-semibold">{formatMoney(displayPrice, product.currency, displayCurrency)}</p>
            {compareAt ? <p className="pb-1 text-slate-500 line-through">{formatMoney(compareAt, product.currency, displayCurrency)}</p> : null}
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold">Model</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {product.variants.map((variant) => (
                <button key={variant.id} className={`rounded-md border p-3 text-left text-sm ${selectedVariant?.id === variant.id ? "border-primary bg-blue-50" : "border-slate-200"}`} onClick={() => setSelectedVariant(variant)}>
                  <span className="block font-semibold">{variant.sku}</span>
                  <span className="mt-1 block text-slate-600">{variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} max={Math.max(1, maxStock)} onChange={setQuantity} />
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!canBuy} onClick={handleAddToCart}>
              <ShoppingBag className="h-4 w-4" />
              Add to cart
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold hover:bg-mist" onClick={handleFavorite}>
              <Heart className="h-4 w-4" />
              {hasFavorite(product.id) ? "Saved" : "Favorite"}
            </button>
          </div>
          {!canBuy ? <p className="mt-3 text-sm text-danger">Select an available variant before adding this product to the cart.</p> : null}

          <section className="mt-8 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Consultar entrega</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[88px_1fr_1fr_1fr_auto]">
              <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Pais" value={deliveryForm.country} onChange={(event) => setDeliveryForm({ ...deliveryForm, country: event.target.value.toUpperCase() })} maxLength={2} />
              <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="CEP / codigo postal" value={deliveryForm.postal_code} onChange={(event) => setDeliveryForm({ ...deliveryForm, postal_code: event.target.value })} />
              <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Estado" value={deliveryForm.state} onChange={(event) => setDeliveryForm({ ...deliveryForm, state: event.target.value })} />
              <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Cidade" value={deliveryForm.city} onChange={(event) => setDeliveryForm({ ...deliveryForm, city: event.target.value })} />
              <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300" disabled={checkingDelivery || !selectedVariant || !deliveryForm.postal_code || !deliveryForm.state || !deliveryForm.city} onClick={checkDelivery}>
                {checkingDelivery ? "Verificando..." : "Verificar"}
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
              <p className="mt-2 font-semibold">International shipping</p>
              <p className="mt-1 text-slate-600">Delivery estimate is calculated at checkout by destination.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">Secure checkout</p>
              <p className="mt-1 text-slate-600">Payment handled by trusted providers.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">Easy returns</p>
              <p className="mt-1 text-slate-600">Policy prepared for global orders.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-semibold">Description</h2>
          <p className="mt-3 leading-8 text-slate-600">{product.description}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-5">
          <h2 className="text-base font-semibold">Specifications</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Currency</dt>
              <dd>{product.currency}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
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
        <h2 className="text-xl font-semibold">Customer reviews</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {reviews.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-5 text-sm text-slate-600">No approved reviews yet.</div>
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
        Back to catalog
      </Link>
    </section>
  );
}
