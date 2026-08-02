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
    <article className="group overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-3 shadow-[0_18px_55px_-34px_rgba(15,23,42,0.38)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-35px_rgba(15,23,42,0.45)]">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[0.92] overflow-hidden rounded-[22px] bg-gradient-to-br from-slate-50 via-white to-blue-50">
          {primaryImage ? (
            <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={primaryImage.url} alt={primaryImage.alt_text ?? displayName} loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-white via-slate-100 to-blue-100 text-sm font-medium text-slate-500">Nexora</div>
          )}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {discount > 0 ? <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">-{discount}%</span> : null}
              {product.is_new ? <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm">New</span> : null}
            </div>
            <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{product.currency}</span>
          </div>
        </div>
      </Link>

      <div className="px-1 pb-1 pt-4">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {product.is_bestseller ? <span>Best seller</span> : null}
          {product.status ? <span>{product.status}</span> : null}
        </div>
        <Link to={`/product/${product.slug}`}>
          <h2 className="mt-2 min-h-[3.5rem] text-lg font-semibold leading-7 tracking-tight text-slate-950">{displayName}</h2>
        </Link>
        <p className="mt-2 line-clamp-2 min-h-[2.8rem] text-sm leading-6 text-slate-600">{displayDescription}</p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-950">{formatMoney(salePrice, product.currency, displayCurrency)}</p>
            {compareAtPrice ? <p className="text-sm text-slate-400 line-through">{formatMoney(compareAtPrice, product.currency, displayCurrency)}</p> : null}
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50" aria-label={t("favorite", language)}>
              <Heart className="h-4 w-4" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label={t("addToCart", language)}
              onClick={addToCart}
              disabled={!primaryVariant}
            >
              <ShoppingBag className="h-4 w-4" />
              {language === "pt" ? "Comprar" : language === "es" ? "Comprar" : "Buy"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
