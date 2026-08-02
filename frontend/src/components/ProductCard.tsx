import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";
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
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const hasFavorite = useFavoritesStore((state) => state.has(product.id));
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

  function handleFavorite() {
    toggleFavorite({
      productId: product.id,
      productSlug: product.slug,
      name: displayName,
      imageUrl: primaryImage?.url,
      currency: product.currency,
      price: salePrice,
    });
  }

  return (
    <article className="group panel flex h-full flex-col overflow-hidden bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
      <Link to={`/product/${product.slug}`} className="flex h-full flex-col">
        <div className="relative overflow-hidden border-b border-slate-200 bg-[#f7f4ee]">
          <div className="absolute left-4 top-4 z-10 flex gap-2">
            {product.is_new ? <span className="badge-dark">New</span> : null}
            {product.is_bestseller ? <span className="badge-subtle">Best seller</span> : null}
            {discount > 0 ? <span className="badge-subtle">-{discount}%</span> : null}
          </div>

          <div className="aspect-[4/4.6] overflow-hidden">
            {primaryImage ? (
              <img
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                src={primaryImage.url}
                alt={primaryImage.alt_text ?? displayName}
                loading="lazy"
              />
            ) : (
              <div className="surface-grid flex h-full items-center justify-center bg-[#efeae1] text-sm uppercase tracking-[0.26em] text-slate-500">
                Nexora
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-slate-400">
            <span>{product.currency}</span>
            <span>{primaryVariant?.sku ?? product.sku}</span>
          </div>

          <h2 className="min-h-[56px] text-lg font-semibold leading-7 tracking-[-0.02em] text-slate-950">{displayName}</h2>
          <p className="mt-3 line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-600">{displayDescription}</p>

          <div className="mt-auto pt-5">
            <div className="flex items-end justify-between gap-3 border-t border-slate-200 pt-4">
              <div>
                <p className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{formatMoney(salePrice, product.currency, displayCurrency)}</p>
                {compareAtPrice ? <p className="mt-1 text-sm text-slate-400 line-through">{formatMoney(compareAtPrice, product.currency, displayCurrency)}</p> : null}
              </div>
              <div className="text-right text-xs leading-5 text-slate-500">
                <p>{primaryVariant?.stock ? `${primaryVariant.stock} ${t("inStockCount", language)}` : t("outOfStock", language)}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-[52px_1fr] border-t border-slate-200">
        <button className="inline-flex h-12 items-center justify-center border-r border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" aria-label={t("favorite", language)} onClick={handleFavorite}>
          <Heart className={`h-4 w-4 ${hasFavorite ? "fill-current" : ""}`} />
        </button>
        <button className="inline-flex h-12 items-center justify-center gap-2 bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label={t("addToCart", language)} onClick={addToCart} disabled={!primaryVariant}>
          <ShoppingBag className="h-4 w-4" />
          {t("addToCart", language)}
        </button>
      </div>
    </article>
  );
}
