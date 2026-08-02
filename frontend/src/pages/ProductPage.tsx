import { Heart, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { QuantityStepper } from "../components/QuantityStepper";
import { Seo } from "../components/Seo";
import { getProduct } from "../services/catalogService";
import { listProductReviews } from "../services/engagementService";
import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";
import type { Product, ProductVariant } from "../types/catalog";
import type { Review } from "../types/engagement";
import { formatMoney } from "../utils/currency";

export function ProductPage() {
  const { slug } = useParams();
  const addItem = useCartStore((state) => state.addItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const hasFavorite = useFavoritesStore((state) => state.has);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
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
            <p className="text-3xl font-semibold">{formatMoney(displayPrice, product.currency)}</p>
            {compareAt ? <p className="pb-1 text-slate-500 line-through">{formatMoney(compareAt, product.currency)}</p> : null}
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
