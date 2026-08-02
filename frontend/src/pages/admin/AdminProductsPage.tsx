import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { AdminTable } from "../../components/AdminTable";
import {
  createAdminProduct,
  estimateCjVariantShipping,
  importCjProduct,
  listAdminProducts,
  previewCjProduct,
  searchCjProducts,
  updateAdminProduct,
} from "../../services/adminService";
import type { Product, SupplierProduct, SupplierShippingEstimate } from "../../types/catalog";
import { formatMoney } from "../../utils/currency";
import { presentSupplierDescription, presentSupplierName } from "../../utils/productPresentation";
import { usePreferencesStore } from "../../stores/preferencesStore";

type ImportTab = "product" | "variants" | "media" | "description" | "shipping";

type ImportVariantDraft = {
  supplier_variant_id: string;
  sku: string;
  name: string;
  sale_price: string;
  cost_price: string;
  stock: string;
  image_url: string;
  selected: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function suggestedPrice(costValue: string | number) {
  const cost = Number(costValue || 0);
  return (cost * 2.2 + 4.9).toFixed(2);
}

function imageList(product: SupplierProduct) {
  return Array.from(new Set([...(product.images ?? []), product.image_url, ...product.variants.map((variant) => variant.image_url)].filter(Boolean) as string[]));
}

export function AdminProductsPage() {
  const language = usePreferencesStore((state) => state.language);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCjImport, setShowCjImport] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", sale_price: "49.00", cost_price: "20.00", stock: "10", short_description: "" });
  const [cjQuery, setCjQuery] = useState("");
  const [cjProducts, setCjProducts] = useState<SupplierProduct[]>([]);
  const [cjLoading, setCjLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", sale_price: "", cost_price: "", short_description: "", description: "" });
  const [importTab, setImportTab] = useState<ImportTab>("product");
  const [preview, setPreview] = useState<SupplierProduct | null>(null);
  const [draft, setDraft] = useState({ name: "", sku: "", description: "", images: [] as string[], variants: [] as ImportVariantDraft[] });
  const [shippingAddress, setShippingAddress] = useState({ country: "BR", state: "AM", city: "Manaus", postal_code: "69028115" });
  const [shippingQuotes, setShippingQuotes] = useState<SupplierShippingEstimate[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingCheckedVariants, setShippingCheckedVariants] = useState(0);

  const selectedVariants = useMemo(() => draft.variants.filter((variant) => variant.selected && variant.supplier_variant_id), [draft.variants]);

  useEffect(() => {
    listAdminProducts().then(setProducts);
  }, []);

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const product = await createAdminProduct({
        name: form.name,
        slug: slugify(form.name),
        sku: form.sku.toUpperCase(),
        sale_price: Number(form.sale_price),
        cost_price: Number(form.cost_price),
        stock: Number(form.stock),
        status: "active",
        short_description: form.short_description,
      });
      setProducts((items) => [product, ...items]);
      setShowForm(false);
      setForm({ name: "", sku: "", sale_price: "49.00", cost_price: "20.00", stock: "10", short_description: "" });
    } catch {
      setError("Nao foi possivel criar o produto. Confira se SKU e slug ainda nao existem.");
    }
  }

  async function searchCj(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCjLoading(true);
    setPreview(null);
    try {
      setCjProducts(await searchCjProducts(cjQuery));
    } catch {
      setError("Nao foi possivel buscar na CJ. Confira CJ_API_KEY e SUPPLIER_PROVIDER=cj no Render backend.");
    } finally {
      setCjLoading(false);
    }
  }

  async function openPreview(product: SupplierProduct) {
    setError(null);
    setPreviewLoading(product.supplier_product_id);
    try {
      const fullProduct = await previewCjProduct(product.supplier_product_id).catch(() => product);
      const images = imageList(fullProduct);
      const cleanName = presentSupplierName(fullProduct.name, fullProduct.description, language);
      const cleanDescription = presentSupplierDescription(fullProduct.name, fullProduct.description, language);
      const variants = fullProduct.variants
        .filter((variant) => variant.supplier_variant_id)
        .slice(0, 40)
        .map((variant, index) => {
          const cost = String(variant.cost || variant.price || "0");
          return {
            supplier_variant_id: variant.supplier_variant_id,
            sku: variant.sku || `${fullProduct.sku}-${index + 1}`,
            name: variant.name || cleanName,
            sale_price: suggestedPrice(cost),
            cost_price: cost,
            stock: String(variant.stock ?? 0),
            image_url: variant.image_url || fullProduct.image_url || "",
            selected: index < 12,
          };
        });
      setPreview(fullProduct);
      setDraft({
        name: cleanName,
        sku: fullProduct.sku || variants[0]?.sku || fullProduct.supplier_product_id,
        description: cleanDescription,
        images,
        variants,
      });
      setShippingQuotes([]);
      setShippingError(null);
      setShippingCheckedVariants(0);
      setImportTab("product");
    } finally {
      setPreviewLoading(null);
    }
  }

  function updateVariant(index: number, patch: Partial<ImportVariantDraft>) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...patch } : variant)),
    }));
  }

  async function importAdvancedProduct() {
    if (!preview || !selectedVariants.length) {
      setError("Selecione pelo menos uma variante CJ valida para importar.");
      return;
    }
    setError(null);
    try {
      const firstVariant = selectedVariants[0];
      const imported = await importCjProduct({
        supplier_product_id: preview.supplier_product_id,
        name: draft.name,
        sku: draft.sku || firstVariant.sku,
        sale_price: Number(firstVariant.sale_price),
        cost_price: Number(firstVariant.cost_price),
        stock: Number(firstVariant.stock),
        supplier_variant_id: firstVariant.supplier_variant_id,
        supplier_sku: firstVariant.sku,
        description: draft.description,
        image_url: firstVariant.image_url || draft.images[0] || preview.image_url,
        images: draft.images,
        variants: selectedVariants.map((variant) => ({
          supplier_variant_id: variant.supplier_variant_id,
          sku: variant.sku,
          name: variant.name,
          sale_price: Number(variant.sale_price),
          cost_price: Number(variant.cost_price),
          stock: Number(variant.stock),
          image_url: variant.image_url || draft.images[0] || null,
          selected: true,
        })),
      });
      setProducts((items) => [imported, ...items]);
      setCjProducts((items) => items.filter((item) => item.supplier_product_id !== preview.supplier_product_id));
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel importar. O produto pode ja existir ou a variante CJ nao veio com ID valido.");
    }
  }

  async function testShipping() {
    if (!selectedVariants.length) {
      setShippingError("Selecione uma variante antes de testar a entrega.");
      return;
    }
    setShippingLoading(true);
    setShippingError(null);
    setShippingQuotes([]);
    setShippingCheckedVariants(0);
    try {
      const testedQuotes: SupplierShippingEstimate[][] = [];
      for (const variant of selectedVariants) {
        testedQuotes.push(await estimateCjVariantShipping({
          supplier_variant_id: variant.supplier_variant_id,
          quantity: 1,
          country: shippingAddress.country.toUpperCase(),
          state: shippingAddress.state,
          city: shippingAddress.city,
          postal_code: shippingAddress.postal_code,
        }));
      }
      setShippingCheckedVariants(selectedVariants.length);
      setShippingQuotes(testedQuotes[0] ?? []);
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : "A CJ nao retornou entrega para todas as variantes selecionadas nesse destino.");
    } finally {
      setShippingLoading(false);
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      sale_price: product.sale_price,
      cost_price: product.cost_price ?? "0",
      short_description: product.short_description ?? "",
      description: product.description ?? "",
    });
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setError(null);
    try {
      const updated = await updateAdminProduct(editingId, {
        name: editForm.name,
        sale_price: Number(editForm.sale_price),
        cost_price: Number(editForm.cost_price),
        short_description: editForm.short_description,
        description: editForm.description,
      });
      setProducts((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
    } catch {
      setError("Nao foi possivel atualizar o produto.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Produtos</h2>
        <div className="flex gap-2">
          <button className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold" onClick={() => setShowCjImport((value) => !value)}>
            Importar da CJ
          </button>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={() => setShowForm((value) => !value)}>
            Novo produto
          </button>
        </div>
      </div>
      {error ? <div className="mb-5 rounded-md bg-red-50 p-3 text-sm text-danger">{error}</div> : null}
      {showCjImport ? (
        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <form onSubmit={searchCj} className="flex flex-col gap-3 md:flex-row">
            <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm" placeholder="Busque na CJ por nome, SKU, produto ID ou variante ID" value={cjQuery} onChange={(event) => setCjQuery(event.target.value)} required />
            <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white" disabled={cjLoading}>
              {cjLoading ? "Buscando..." : "Pesquisar CJ"}
            </button>
          </form>

          <div className="mt-5 grid gap-3">
            {cjProducts.map((product) => {
              const variant = product.variants[0];
              return (
                <article key={product.supplier_product_id} className="grid gap-4 rounded-md border border-slate-200 p-4 md:grid-cols-[88px_1fr_auto]">
                  <div className="h-20 w-20 overflow-hidden rounded-md bg-mist">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <h3 className="font-semibold">{presentSupplierName(product.name, product.description, language)}</h3>
                    <p className="mt-1 text-sm text-slate-600">ID CJ: {product.supplier_product_id}</p>
                    <p className="mt-1 text-sm text-slate-600">Primeira variante: {variant?.supplier_variant_id || "sem ID"} - {variant?.sku}</p>
                    <p className="mt-1 text-sm text-slate-600">Custo CJ: USD {variant?.cost ?? "0"} - Estoque {variant?.stock ?? 0}</p>
                  </div>
                  <button type="button" className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300" disabled={!variant?.supplier_variant_id || previewLoading === product.supplier_product_id} onClick={() => openPreview(product)}>
                    {previewLoading === product.supplier_product_id ? "Abrindo..." : "Configurar"}
                  </button>
                </article>
              );
            })}
          </div>

          {preview ? (
            <div className="mt-6 rounded-lg border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">Previa de importacao CJ</p>
                  <h3 className="mt-1 text-lg font-semibold">{draft.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={() => setPreview(null)}>Cancelar</button>
                  <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={importAdvancedProduct}>Importar selecionados</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
                {([
                  ["product", "Produto"],
                  ["variants", "Variantes e precos"],
                  ["media", "Imagens"],
                  ["description", "Descricao"],
                  ["shipping", "Entrega Brasil"],
                ] as Array<[ImportTab, string]>).map(([tab, label]) => (
                  <button key={tab} type="button" className={`rounded-md px-3 py-2 text-sm font-semibold ${importTab === tab ? "bg-primary text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setImportTab(tab)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {importTab === "product" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1 text-sm font-semibold">
                      Nome na sua loja
                      <input className="h-10 rounded-md border border-slate-200 px-3 font-normal" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      SKU principal
                      <input className="h-10 rounded-md border border-slate-200 px-3 font-normal" value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} />
                    </label>
                    <div className="rounded-md bg-blue-50 p-3 text-sm text-slate-700 md:col-span-2">
                      Produto CJ {preview.supplier_product_id}. Se vender, o pedido guarda a variante CJ exata para criar o pedido no fornecedor depois do pagamento.
                    </div>
                  </div>
                ) : null}

                {importTab === "variants" ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                          <th className="px-2 py-2">Usar</th>
                          <th className="px-2 py-2">Imagem</th>
                          <th className="px-2 py-2">SKU CJ</th>
                          <th className="px-2 py-2">Opcao</th>
                          <th className="px-2 py-2">Custo CJ</th>
                          <th className="px-2 py-2">Seu preco</th>
                          <th className="px-2 py-2">Estoque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draft.variants.map((variant, index) => (
                          <tr key={`${variant.supplier_variant_id}-${index}`} className="border-b border-slate-100">
                            <td className="px-2 py-2"><input type="checkbox" checked={variant.selected} onChange={(event) => updateVariant(index, { selected: event.target.checked })} /></td>
                            <td className="px-2 py-2">{variant.image_url ? <img src={variant.image_url} alt="" className="h-12 w-12 rounded-md object-cover" /> : <div className="h-12 w-12 rounded-md bg-mist" />}</td>
                            <td className="px-2 py-2 text-slate-600">{variant.sku}</td>
                            <td className="px-2 py-2"><input className="h-9 w-48 rounded-md border border-slate-200 px-2" value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} /></td>
                            <td className="px-2 py-2"><input className="h-9 w-24 rounded-md border border-slate-200 px-2" value={variant.cost_price} onChange={(event) => updateVariant(index, { cost_price: event.target.value, sale_price: suggestedPrice(event.target.value) })} /></td>
                            <td className="px-2 py-2"><input className="h-9 w-24 rounded-md border border-slate-200 px-2 font-semibold" value={variant.sale_price} onChange={(event) => updateVariant(index, { sale_price: event.target.value })} /></td>
                            <td className="px-2 py-2"><input className="h-9 w-20 rounded-md border border-slate-200 px-2" value={variant.stock} onChange={(event) => updateVariant(index, { stock: event.target.value })} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-3 text-sm text-slate-600">{selectedVariants.length} variantes selecionadas. Seu preco e o valor que aparece no catalogo; custo CJ fica salvo para margem e fornecedor.</p>
                  </div>
                ) : null}

                {importTab === "media" ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {draft.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="rounded-md border border-slate-200 p-2">
                        <img src={image} alt="" className="aspect-square w-full rounded-md object-cover" />
                        <button type="button" className="mt-2 text-sm font-semibold text-danger" onClick={() => setDraft((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }))}>Remover</button>
                      </div>
                    ))}
                    <textarea className="min-h-28 rounded-md border border-slate-200 p-3 text-sm sm:col-span-2 lg:col-span-4" placeholder="Cole URLs extras de imagens, uma por linha" onBlur={(event) => {
                      const extras = event.currentTarget.value.split(/\s+/).filter((value) => value.startsWith("http"));
                      if (extras.length) setDraft((current) => ({ ...current, images: Array.from(new Set([...current.images, ...extras])) }));
                      event.currentTarget.value = "";
                    }} />
                  </div>
                ) : null}

                {importTab === "description" ? (
                  <textarea className="min-h-80 w-full rounded-md border border-slate-200 p-3 text-sm" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Descricao longa do produto para aparecer na pagina do cliente." />
                ) : null}

                {importTab === "shipping" ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-4">
                      <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={shippingAddress.country} onChange={(event) => setShippingAddress({ ...shippingAddress, country: event.target.value })} placeholder="Pais" />
                      <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={shippingAddress.state} onChange={(event) => setShippingAddress({ ...shippingAddress, state: event.target.value })} placeholder="Estado" />
                      <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={shippingAddress.city} onChange={(event) => setShippingAddress({ ...shippingAddress, city: event.target.value })} placeholder="Cidade" />
                      <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={shippingAddress.postal_code} onChange={(event) => setShippingAddress({ ...shippingAddress, postal_code: event.target.value })} placeholder="CEP" />
                    </div>
                    <button type="button" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={testShipping} disabled={shippingLoading}>{shippingLoading ? "Consultando CJ..." : "Testar entrega das variantes selecionadas"}</button>
                    {shippingError ? <div className="rounded-md bg-red-50 p-3 text-sm text-danger">{shippingError}</div> : null}
                    {shippingCheckedVariants ? <div className="rounded-md bg-green-50 p-3 text-sm text-emerald-700">CJ retornou entrega para {shippingCheckedVariants} variante(s) selecionada(s). As opcoes abaixo sao da primeira variante; no checkout o sistema recalcula o carrinho completo.</div> : null}
                    {shippingQuotes.length ? (
                      <div className="grid gap-2 md:grid-cols-3">
                        {shippingQuotes.map((quote) => (
                          <div key={quote.code} className="rounded-md border border-slate-200 p-3 text-sm">
                            <p className="font-semibold">{quote.name}</p>
                            <p className="mt-1">{formatMoney(Number(quote.amount), quote.currency)}</p>
                            <p className="mt-1 text-slate-600">{quote.min_days} a {quote.max_days} dias uteis</p>
                            <p className="mt-1 text-slate-600">Rastreio: {quote.tracking_available ? "sim" : "nao informado"}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
      {showForm ? (
        <form onSubmit={submitProduct} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-6">
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Nome do produto" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Preco" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Custo" value={form.cost_price} onChange={(event) => setForm({ ...form, cost_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Estoque" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-5" placeholder="Resumo" value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} />
          <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white">Salvar</button>
        </form>
      ) : null}
      {editingId ? (
        <form onSubmit={saveEdit} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-6">
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Nome do produto" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Seu preco de venda" value={editForm.sale_price} onChange={(event) => setEditForm({ ...editForm, sale_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Custo CJ" value={editForm.cost_price} onChange={(event) => setEditForm({ ...editForm, cost_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Resumo" value={editForm.short_description} onChange={(event) => setEditForm({ ...editForm, short_description: event.target.value })} />
          <textarea className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm md:col-span-5" placeholder="Descricao completa" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
          <div className="flex gap-2">
            <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white">Salvar</button>
            <button type="button" className="rounded-md border border-slate-200 px-4 text-sm font-semibold" onClick={() => setEditingId(null)}>Cancelar</button>
          </div>
        </form>
      ) : null}
      <AdminTable columns={["Produto", "SKU", "Preco", "Estoque", "Status", "Acao"]}>
        {products.map((product) => (
          <tr key={product.id}>
            <td className="px-4 py-3 font-semibold">{product.name}</td>
            <td className="px-4 py-3 text-slate-600">{product.sku}</td>
            <td className="px-4 py-3">{formatMoney(Number(product.sale_price), product.currency)}</td>
            <td className="px-4 py-3">{product.variants.reduce((total, variant) => total + variant.stock, 0)}</td>
            <td className="px-4 py-3"><Status value={product.status} /></td>
            <td className="px-4 py-3">
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => startEdit(product)}>Editar</button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

export function PageTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {action ? <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onAction}>{action}</button> : null}
    </div>
  );
}

export function Status({ value }: { value: string }) {
  return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{value}</span>;
}
