import { Heart, LogOut, PackageSearch, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCurrentUser } from "../services/authService";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useFavoritesStore } from "../stores/favoritesStore";
import type { User } from "../types/auth";

export function AccountPage() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const favorites = useFavoritesStore((state) => state.items);
  const [user, setUser] = useState<User | null>(null);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    getCurrentUser().then(setUser).catch(() => logout());
  }, [accessToken, logout]);

  if (!accessToken) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-semibold">My account</h1>
        <div className="mt-6 rounded-lg border border-slate-200 p-6 shadow-sm">
          <p className="text-slate-600">Entre para acompanhar seus dados, favoritos e pedidos recentes.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">Entrar</Link>
            <Link to="/register" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">Criar conta</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">My account</h1>
          <p className="mt-2 text-sm text-slate-600">{user ? `${user.first_name} ${user.last_name} - ${user.email}` : "Carregando perfil..."}</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link to="/cart" className="rounded-lg border border-slate-200 p-5 shadow-sm hover:border-primary">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <p className="mt-3 font-semibold">Cart</p>
          <p className="mt-1 text-sm text-slate-600">{cartItems.length} item(ns) salvos.</p>
        </Link>
        <Link to="/favorites" className="rounded-lg border border-slate-200 p-5 shadow-sm hover:border-primary">
          <Heart className="h-5 w-5 text-primary" />
          <p className="mt-3 font-semibold">Favorites</p>
          <p className="mt-1 text-sm text-slate-600">{favorites.length} produto(s) favoritos.</p>
        </Link>
        <div className="rounded-lg border border-slate-200 p-5 shadow-sm">
          <UserRound className="h-5 w-5 text-primary" />
          <p className="mt-3 font-semibold">Profile</p>
          <p className="mt-1 text-sm text-slate-600">{user?.is_email_verified ? "Email verificado." : "Email ainda nao verificado."}</p>
        </div>
      </div>

      <form
        className="mt-8 rounded-lg border border-slate-200 p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          if (orderNumber.trim()) navigate(`/orders/${encodeURIComponent(orderNumber.trim())}`);
        }}
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold"><PackageSearch className="h-5 w-5" /> Buscar pedido</h2>
        <div className="mt-4 flex gap-2">
          <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm uppercase outline-none focus:border-primary" placeholder="NX-..." value={orderNumber} onChange={(event) => setOrderNumber(event.target.value.toUpperCase())} />
          <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white">Abrir</button>
        </div>
      </form>
    </section>
  );
}
