import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

import { useCartStore } from "../stores/cartStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import type { Product } from "../types/catalog";
import { formatMoney } from "../utils/currency";
import { t } from "../utils/i18n";
import { productDisplayDescription, productDisplayName } from "../utils/productPresentation";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const displayCurrency = usePreferencesStore((state) => state.currency);
  const language = usePreferencesStore((state) => state.language);
  const primaryVariant = product.variants[0];
  const primaryImage = product.images.find((image) => image.is_primary) ?? product.images[0];
  const salePrice = Number(product.sale_price);
  const compareAtPrice = product.compare_at_price ? Number(product.compare_at_price) : null;
  const discount = compareAtPrice && compareAtPrice > salePrice ? Math.round(((compareAtPrice - salePrice) / compareAtPrice) * 100) : 0;
  const displayName = productDisplayName(product, language);
  const displayDescription = productDisplayDescription(product, language);

  function addToCart() {
    if (!primaryVariant) return;
    addItem({
      productId: product.id,
      productSlug: product.slug,
      variantId: primaryVariant.id,
      variantSku: primaryVariant.sku,
      name: displayName,
      imageUrl: primaryImage?.url,
      currency: product.currency,
      unitPrice: Number(primaryVariant.price ?? product.sale_price),
      quantity: 1,
    });
  }

  return (
    <article className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-md bg-mist">
          {primaryImage ? (
            <img className="h-full w-full object-cover transition duration-300 group-hover:scale-105" src={primaryImage.url} alt={primaryImage.alt_text ?? displayName} loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-white via-slate-100 to-blue-100 text-sm text-slate-500">Nexora</div>
          )}
          {discount > 0 ? <span className="absolute left-3 top-3 rounded-md bg-success px-2 py-1 text-xs font-semibold text-white">{discount}% off</span> : null}
        </div>
        <div className="mt-4">
          <div className="flex gap-2">
            {product.is_new ? <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-primary">New</span> : null}
            {product.is_bestseller ? <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Best seller</span> : null}
          </div>
          <h2 className="mt-3 min-h-12 text-base font-semibold leading-6">{displayName}</h2>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{displayDescription}</p>
        </div>
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{formatMoney(salePrice, product.currency, displayCurrency)}</p>
          {compareAtPrice ? <p className="text-xs text-slate-500 line-through">{formatMoney(compareAtPrice, product.currency, displayCurrency)}</p> : null}
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-slate-200 p-2 hover:bg-mist" aria-label={t("favorite", language)}>
            <Heart className="h-4 w-4" />
          </button>
          <button className="rounded-md bg-primary p-2 text-white hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-slate-300" aria-label={t("addToCart", language)} onClick={addToCart} disabled={!primaryVariant}>
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
