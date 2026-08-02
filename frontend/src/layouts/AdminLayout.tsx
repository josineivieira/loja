import { BarChart3, Bell, Boxes, ClipboardList, CreditCard, FileText, Home, LogOut, Megaphone, Package, Settings, ShieldCheck, Star, Tags, Truck, Users } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: BarChart3 },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Boxes },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: Tags },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/shipping", label: "Shipping", icon: Truck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/integrations", label: "Integrations", icon: ShieldCheck },
  { to: "/admin/banners", label: "Banners", icon: Megaphone },
  { to: "/admin/pages", label: "Pages", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!accessToken) navigate("/login");
  }, [accessToken, navigate]);

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <span className="text-lg font-semibold">Nexora Admin</span>
          <NavLink to="/" className="rounded-md p-2 hover:bg-mist" title="Storefront">
            <Home className="h-4 w-4" />
          </NavLink>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? "bg-blue-50 font-semibold text-primary" : "text-slate-600 hover:bg-mist hover:text-ink"}`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Operations</p>
            <h1 className="text-lg font-semibold">Admin panel</h1>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
