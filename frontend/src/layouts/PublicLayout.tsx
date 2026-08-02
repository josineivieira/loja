import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useCartStore } from "../stores/cartStore";
import { usePreferencesStore, type DisplayCurrency, type Language } from "../stores/preferencesStore";
import { t } from "../utils/i18n";

export function PublicLayout() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const { language, currency, setLanguage, setCurrency } = usePreferencesStore();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-semibold tracking-normal">
            Nexora
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link to="/catalog">{t("catalog", language)}</Link>
            <Link to="/about">{t("about", language)}</Link>
            <Link to="/faq">{t("faq", language)}</Link>
          </nav>
          <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-slate-500" />
            <input className="w-full text-sm outline-none" placeholder={t("searchPlaceholder", language)} value={query} onChange={(event) => setQuery(event.target.value)} />
          </form>
          <select className="rounded-md border border-slate-200 px-2 py-2 text-sm" value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label="Language">
            <option value="en">EN</option>
            <option value="pt">PT</option>
            <option value="es">ES</option>
          </select>
          <select className="rounded-md border border-slate-200 px-2 py-2 text-sm" value={currency} onChange={(event) => setCurrency(event.target.value as DisplayCurrency)} aria-label="Currency">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BRL">BRL</option>
          </select>
          <Link aria-label="Account" to="/account" className="rounded-md p-2 hover:bg-mist">
            <UserRound className="h-5 w-5" />
          </Link>
          <Link aria-label="Favorites" to="/favorites" className="rounded-md p-2 hover:bg-mist">
            <Heart className="h-5 w-5" />
          </Link>
          <Link aria-label="Cart" to="/cart" className="relative rounded-md p-2 hover:bg-mist">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-xs text-white">{itemCount}</span>
            ) : null}
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
