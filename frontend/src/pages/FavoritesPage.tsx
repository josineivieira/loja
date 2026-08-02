import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useFavoritesStore } from "../stores/favoritesStore";
import { formatMoney } from "../utils/currency";

export function FavoritesPage() {
  const { items, remove } = useFavoritesStore();

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Favorites</h1>
      {items.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-200 p-8 text-center text-slate-600">No favorite products saved yet.</div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.productId} className="rounded-lg border border-slate-200 p-3 shadow-sm">
              <Link to={`/product/${item.productSlug}`} className="block aspect-square overflow-hidden rounded-md bg-mist">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : null}
              </Link>
              <h2 className="mt-4 min-h-12 font-semibold">{item.name}</h2>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold">{formatMoney(item.price, item.currency)}</span>
                <button className="rounded-md p-2 text-danger hover:bg-red-50" onClick={() => remove(item.productId)} aria-label="Remove favorite">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

