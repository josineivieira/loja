import { PackageSearch } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function OrdersPage() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">My orders</h1>
      <p className="mt-2 text-sm text-slate-600">Use o numero recebido na confirmacao para consultar status, pagamento e itens do pedido.</p>
      <form
        className="mt-6 rounded-lg border border-slate-200 p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          if (orderNumber.trim()) navigate(`/orders/${encodeURIComponent(orderNumber.trim())}`);
        }}
      >
        <label className="text-sm font-medium">
          Order number
          <div className="mt-2 flex gap-2">
            <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm uppercase outline-none focus:border-primary" placeholder="NX-..." value={orderNumber} onChange={(event) => setOrderNumber(event.target.value.toUpperCase())} />
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
              <PackageSearch className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </label>
      </form>
      <Link to="/account" className="mt-5 inline-flex text-sm font-semibold text-primary">Voltar para minha conta</Link>
    </section>
  );
}
