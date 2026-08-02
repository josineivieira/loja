import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Loader2, MapPin, PackageCheck, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { calculateCheckout, createOrder, createPaymentSession } from "../services/checkoutService";
import { checkoutAddressSchema, type CheckoutAddressForm } from "../schemas/checkoutSchemas";
import { useCartStore } from "../stores/cartStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import type { CheckoutCalculation } from "../types/checkout";
import { formatMoney } from "../utils/currency";
import type { Language } from "../utils/i18n";

const defaultAddress: CheckoutAddressForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country: "BR",
  state: "",
  city: "",
  address_line1: "",
  address_line2: "",
  district: "",
  postal_code: "",
  notes: "",
};

const identityFields: Array<[keyof CheckoutAddressForm, string]> = [
  ["first_name", "Primeiro nome"],
  ["last_name", "Sobrenome"],
  ["email", "E-mail"],
  ["phone", "Telefone"],
];

const addressFields: Array<[keyof CheckoutAddressForm, string]> = [
  ["country", "País"],
  ["postal_code", "Código postal"],
  ["state", "Estado/Província"],
  ["city", "Cidade"],
  ["district", "Bairro"],
  ["address_line1", "Endereço"],
  ["address_line2", "Complemento"],
];

const checkoutCopy: Record<Language, Record<string, string>> = {
  en: {
    checkout: "Checkout",
    identification: "Identification",
    address: "Address",
    delivery: "Delivery",
    payment: "Payment",
    review: "Review",
    emptyCart: "Your cart is empty",
    browseCatalog: "Browse catalog",
    creatingPayment: "Creating secure payment session...",
    doNotClose: "Please do not close or refresh this page.",
    invalidField: "Invalid field",
    notes: "Notes",
    deliveryMethod: "Delivery method",
    businessDays: "business days",
    trackingAvailable: "Tracking available",
    trackingUnavailable: "Tracking not informed",
    free: "Free",
    paymentInfo: "After placing the order, Nexora creates a secure Stripe Checkout session. If production Stripe keys are not configured yet, the order stays pending without charging a card.",
    reviewOrder: "Review order",
    back: "Back",
    checking: "Checking...",
    continue: "Continue",
    redirecting: "Redirecting...",
    placeOrder: "Place order",
    summary: "Summary",
    coupon: "Coupon",
    apply: "Apply",
    subtotal: "Subtotal",
    discount: "Discount",
    shipping: "Shipping",
    taxes: "Taxes",
    total: "Total",
    currencyNote: "Reference display in {display}. Final charge is processed in {charge}.",
    recalculationNote: "The system recalculates prices, discounts, shipping and stock before creating the order.",
    postalLooking: "Looking up postal code...",
    postalNotFound: "Postal code not found.",
    postalFilled: "Address filled from postal code. Add the street number.",
    postalFailed: "Unable to look up postal code.",
  },
  pt: {
    checkout: "Finalizar compra",
    identification: "Identificação",
    address: "Endereço",
    delivery: "Entrega",
    payment: "Pagamento",
    review: "Revisão",
    emptyCart: "Seu carrinho está vazio",
    browseCatalog: "Ver catálogo",
    creatingPayment: "Criando pagamento seguro...",
    doNotClose: "Não feche nem atualize esta página.",
    invalidField: "Campo inválido",
    notes: "Observações",
    deliveryMethod: "Método de entrega",
    businessDays: "dias úteis",
    trackingAvailable: "Rastreamento disponível",
    trackingUnavailable: "Rastreamento não informado",
    free: "Grátis",
    paymentInfo: "Depois de fazer o pedido, a Nexora cria uma sessão segura de pagamento no Stripe. Se as chaves de produção ainda não estiverem configuradas, o pedido fica pendente sem cobrar o cartão.",
    reviewOrder: "Revisar pedido",
    back: "Voltar",
    checking: "Verificando...",
    continue: "Continuar",
    redirecting: "Redirecionando...",
    placeOrder: "Fazer pedido",
    summary: "Resumo",
    coupon: "Cupom",
    apply: "Aplicar",
    subtotal: "Subtotal",
    discount: "Desconto",
    shipping: "Entrega",
    taxes: "Impostos",
    total: "Total",
    currencyNote: "Valores exibidos em {display}. A cobrança final é processada em {charge}.",
    recalculationNote: "O sistema recalcula preços, descontos, frete e estoque antes de criar o pedido.",
    postalLooking: "Consultando CEP...",
    postalNotFound: "CEP não encontrado.",
    postalFilled: "Endereço preenchido pelo CEP. Adicione o número.",
    postalFailed: "Não foi possível consultar o CEP.",
  },
  es: {
    checkout: "Finalizar compra",
    identification: "Identificacion",
    address: "Direccion",
    delivery: "Entrega",
    payment: "Pago",
    review: "Revision",
    emptyCart: "Tu carrito esta vacio",
    browseCatalog: "Ver catalogo",
    creatingPayment: "Creando pago seguro...",
    doNotClose: "No cierres ni actualices esta pagina.",
    invalidField: "Campo invalido",
    notes: "Notas",
    deliveryMethod: "Metodo de entrega",
    businessDays: "dias habiles",
    trackingAvailable: "Rastreo disponible",
    trackingUnavailable: "Rastreo no informado",
    free: "Gratis",
    paymentInfo: "Despues de realizar el pedido, Nexora crea una sesion segura de pago en Stripe. Si las claves de produccion aun no estan configuradas, el pedido queda pendiente sin cobrar la tarjeta.",
    reviewOrder: "Revisar pedido",
    back: "Volver",
    checking: "Verificando...",
    continue: "Continuar",
    redirecting: "Redirigiendo...",
    placeOrder: "Realizar pedido",
    summary: "Resumen",
    coupon: "Cupon",
    apply: "Aplicar",
    subtotal: "Subtotal",
    discount: "Descuento",
    shipping: "Envio",
    taxes: "Impuestos",
    total: "Total",
    currencyNote: "Valores mostrados en {display}. El cobro final se procesa en {charge}.",
    recalculationNote: "El sistema recalcula precios, descuentos, envio y stock antes de crear el pedido.",
    postalLooking: "Consultando codigo postal...",
    postalNotFound: "Codigo postal no encontrado.",
    postalFilled: "Direccion completada por codigo postal. Agrega el numero.",
    postalFailed: "No se pudo consultar el codigo postal.",
  },
};

const localizedIdentityFields: Record<Language, Array<[keyof CheckoutAddressForm, string]>> = {
  en: [["first_name", "First name"], ["last_name", "Last name"], ["email", "E-mail"], ["phone", "Phone"]],
  pt: identityFields,
  es: [["first_name", "Nombre"], ["last_name", "Apellido"], ["email", "E-mail"], ["phone", "Telefono"]],
};

const localizedAddressFields: Record<Language, Array<[keyof CheckoutAddressForm, string]>> = {
  en: [["country", "Country"], ["postal_code", "Postal code"], ["state", "State/Province"], ["city", "City"], ["district", "District"], ["address_line1", "Address"], ["address_line2", "Complement"]],
  pt: addressFields,
  es: [["country", "Pais"], ["postal_code", "Codigo postal"], ["state", "Estado/Provincia"], ["city", "Ciudad"], ["district", "Barrio"], ["address_line1", "Direccion"], ["address_line2", "Complemento"]],
};

function shippingDisplayName(name: string, code: string, language: Language) {
  const source = `${name} ${code}`.toLowerCase();
  if (source.includes("postal") || source.includes("postnl")) {
    return language === "pt" ? "Envio postal internacional" : language === "es" ? "Envio postal internacional" : "International postal shipping";
  }
  if (source.includes("special") || source.includes("liquid") || source.includes("line")) {
    return language === "pt" ? "Envio rastreado" : language === "es" ? "Envio con rastreo" : "Tracked shipping";
  }
  return language === "pt" ? "Envio econômico" : language === "es" ? "Envio económico" : "Economy shipping";
}

function customerMessage(message: string) {
  if (message.includes("Enter the delivery address")) return "Informe seu endereço de entrega para verificar disponibilidade e frete.";
  if (message.includes("CJ did not return") || message.includes("shipping quote")) return "Ainda não temos entrega disponível para esse endereço com os produtos do carrinho. Confira o CEP ou escolha outro produto.";
  if (message.includes("Delivery is not available")) return "Ainda não temos entrega disponível para esse endereço com os produtos do carrinho. Confira se o país, CEP, estado e cidade estão corretos.";
  if (message.includes("without CJ variant IDs")) return "Este produto precisa ser atualizado antes de finalizar a compra.";
  return message;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const displayCurrency = usePreferencesStore((state) => state.currency);
  const language = usePreferencesStore((state) => state.language);
  const copy = checkoutCopy[language];
  const [step, setStep] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [shippingMethodCode, setShippingMethodCode] = useState<string | undefined>();
  const [calculation, setCalculation] = useState<CheckoutCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutAddressForm>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: defaultAddress,
    mode: "onBlur",
  });

  const payloadItems = useMemo(
    () =>
      items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    [items],
  );

  async function recalculate(address?: CheckoutAddressForm, code = couponCode, shipping = shippingMethodCode) {
    if (payloadItems.length === 0) return false;
    setLoading(true);
    setError(null);
    try {
      const data = await calculateCheckout({
        items: payloadItems,
        address,
        coupon_code: code || undefined,
        shipping_method_code: shipping,
        currency: items[0]?.currency ?? "USD",
      });
      setCalculation(data);
      if (!shipping && data.totals.shipping_method_code) setShippingMethodCode(data.totals.shipping_method_code);
      return true;
    } catch (err) {
      setCalculation(null);
      setShippingMethodCode(undefined);
      setError(customerMessage(err instanceof Error ? err.message : "Unable to calculate checkout."));
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    recalculate();
  }, [payloadItems]);

  const watchedPostalCode = form.watch("postal_code");
  const watchedCountry = form.watch("country");

  useEffect(() => {
    const digits = watchedPostalCode?.replace(/\D/g, "") ?? "";
    if (digits.length !== 8) return;
    const timeout = window.setTimeout(async () => {
      setCepStatus(copy.postalLooking);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await response.json();
        if (data.erro) {
          setCepStatus(copy.postalNotFound);
          return;
        }
        if (watchedCountry?.toUpperCase() !== "BR") form.setValue("country", "BR", { shouldValidate: true });
        form.setValue("state", data.uf ?? "", { shouldValidate: true });
        form.setValue("city", data.localidade ?? "", { shouldValidate: true });
        if (data.logradouro) form.setValue("address_line1", data.logradouro, { shouldValidate: true });
        if (data.bairro) form.setValue("district", data.bairro, { shouldValidate: true });
        setCepStatus(copy.postalFilled);
      } catch {
        setCepStatus(copy.postalFailed);
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [watchedPostalCode, watchedCountry, form]);

  async function applyCoupon() {
    await recalculate(form.getValues(), couponCode, shippingMethodCode);
  }

  async function continueCheckout() {
    if (loading || submitting) return;
    if (step === 1) {
      const isValid = await form.trigger(["first_name", "last_name", "email", "phone"]);
      if (!isValid) return;
    }
    if (step === 2) {
      const isValid = await form.trigger();
      if (!isValid) return;
      const calculated = await recalculate(form.getValues());
      if (!calculated) return;
    }
    if (step === 3 && !shippingMethodCode) return;
    setStep((value) => value + 1);
  }

  async function selectShippingMethod(code: string) {
    if (loading || submitting) return;
    const isValid = await form.trigger();
    if (!isValid) {
      setStep(2);
      return;
    }
    setShippingMethodCode(code);
    await recalculate(form.getValues(), couponCode, code);
  }

  async function goToStep(targetStep: number) {
    if (submitting || targetStep === step) return;
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }
    if (targetStep >= 2) {
      const isIdentityValid = await form.trigger(["first_name", "last_name", "email", "phone"]);
      if (!isIdentityValid) {
        setStep(1);
        return;
      }
    }
    if (targetStep >= 3) {
      const isAddressValid = await form.trigger();
      if (!isAddressValid) {
        setStep(2);
        return;
      }
      const calculated = await recalculate(form.getValues());
      if (!calculated) {
        setStep(2);
        return;
      }
    }
    if (targetStep >= 4 && !shippingMethodCode) {
      setStep(3);
      return;
    }
    setStep(targetStep);
  }

  async function submit(values: CheckoutAddressForm) {
    if (!calculation || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        items: payloadItems,
        address: values,
        coupon_code: couponCode || undefined,
        shipping_method_code: shippingMethodCode,
        currency: calculation.totals.currency,
        idempotency_key: crypto.randomUUID(),
      });
      const paymentSession = await createPaymentSession(order.order_number);
      if (paymentSession.payment_url) {
        clear();
        window.location.href = paymentSession.payment_url;
        return;
      }
      clear();
      navigate(`/order-confirmation?order=${encodeURIComponent(order.order_number)}&payment=${paymentSession.mode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-lg border border-slate-200 p-10 text-center">
          <h1 className="text-3xl font-semibold">{copy.emptyCart}</h1>
          <Link to="/catalog" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white">
            {copy.browseCatalog}
          </Link>
        </div>
      </section>
    );
  }

  const totals = calculation?.totals;
  const currency = totals?.currency ?? items[0]?.currency ?? "USD";

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-8">
      {submitting ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/80 backdrop-blur-sm">
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-lg">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="mt-3 font-semibold">{copy.creatingPayment}</p>
            <p className="mt-1 text-sm text-slate-600">{copy.doNotClose}</p>
          </div>
        </div>
      ) : null}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">{copy.checkout}</h1>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {[
            [copy.identification, MapPin],
            [copy.address, MapPin],
            [copy.delivery, Truck],
            [copy.payment, CreditCard],
            [copy.review, PackageCheck],
          ].map(([label, Icon], index) => (
            <button key={label as string} disabled={submitting || loading} className={`rounded-md border px-3 py-3 text-left text-sm disabled:opacity-60 ${step === index + 1 ? "border-primary bg-blue-50 text-primary" : "border-slate-200"}`} onClick={() => goToStep(index + 1)}>
              <Icon className="mb-2 h-4 w-4" />
              {label as string}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(submit)} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 p-5 shadow-sm">
          {error ? <div className="mb-5 rounded-md bg-red-50 p-3 text-sm text-danger">{error}</div> : null}

          {step <= 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {(step === 1 ? localizedIdentityFields[language] : localizedAddressFields[language]).map(([name, label]) => (
                <label key={name} className={name === "address_line1" ? "text-sm font-medium md:col-span-2" : "text-sm font-medium"}>
                  {label}
                  <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary" {...form.register(name as keyof CheckoutAddressForm)} />
                  {form.formState.errors[name as keyof CheckoutAddressForm] ? <span className="mt-1 block text-xs text-danger">{copy.invalidField}</span> : null}
                </label>
              ))}
              {cepStatus ? <p className="text-sm text-slate-600 md:col-span-2">{cepStatus}</p> : null}
              <label className="text-sm font-medium md:col-span-2">
                {copy.notes}
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" {...form.register("notes")} />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="text-lg font-semibold">{copy.deliveryMethod}</h2>
              <div className="mt-4 grid gap-3">
                {(calculation?.shipping_methods ?? []).map((method) => (
                  <label key={method.code} className={`flex cursor-pointer items-center justify-between gap-4 rounded-md border p-4 ${shippingMethodCode === method.code ? "border-primary bg-blue-50" : "border-slate-200"}`}>
                    <span>
                      <span className="block font-semibold">{shippingDisplayName(method.name, method.code, language)}</span>
                      <span className="mt-1 block text-sm text-slate-600">{method.min_days}-{method.max_days} {copy.businessDays}</span>
                      <span className="mt-1 block text-xs text-slate-500">{method.tracking_available ? copy.trackingAvailable : copy.trackingUnavailable}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{Number(method.amount) === 0 ? copy.free : formatMoney(Number(method.amount), method.currency, displayCurrency)}</span>
                      <input type="radio" checked={shippingMethodCode === method.code} onChange={() => selectShippingMethod(method.code)} />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h2 className="text-lg font-semibold">{copy.payment}</h2>
              <div className="mt-4 rounded-md border border-slate-200 p-4 text-sm text-slate-600">
                {copy.paymentInfo}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <h2 className="text-lg font-semibold">{copy.reviewOrder}</h2>
              <div className="mt-4 space-y-3">
                {calculation?.items.map((item) => (
                  <div key={item.variant_id} className="flex justify-between gap-4 rounded-md bg-mist p-3 text-sm">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span>{formatMoney(Number(item.total_price), item.currency, displayCurrency)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-between gap-3">
            <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm disabled:text-slate-300" disabled={step === 1 || submitting} onClick={() => setStep((value) => value - 1)}>
              {copy.back}
            </button>
            {step < 5 ? (
              <button type="button" disabled={loading || submitting} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={continueCheckout}>
                {loading ? copy.checking : copy.continue}
              </button>
            ) : (
              <button type="submit" disabled={submitting || loading} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
                {submitting ? copy.redirecting : copy.placeOrder}
              </button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{copy.summary}</h2>
          <div className="mt-4 flex gap-2">
            <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm uppercase outline-none" placeholder={copy.coupon} value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} />
            <button type="button" disabled={loading || submitting} className="rounded-md border border-slate-200 px-3 text-sm font-semibold disabled:text-slate-300" onClick={applyCoupon}>
              {copy.apply}
            </button>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">{copy.subtotal}</span><span>{formatMoney(Number(totals?.subtotal_amount ?? 0), currency, displayCurrency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">{copy.discount}</span><span>{formatMoney(Number(totals?.discount_amount ?? 0), currency, displayCurrency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">{copy.shipping}</span><span>{formatMoney(Number(totals?.shipping_amount ?? 0), currency, displayCurrency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">{copy.taxes}</span><span>{formatMoney(Number(totals?.tax_amount ?? 0), currency, displayCurrency)}</span></div>
            <div className="border-t border-slate-200 pt-3 text-base font-semibold">
              <div className="flex justify-between"><span>{copy.total}</span><span>{formatMoney(Number(totals?.total_amount ?? 0), currency, displayCurrency)}</span></div>
            </div>
          </div>
          {displayCurrency !== currency ? <p className="mt-3 text-xs leading-5 text-slate-500">{copy.currencyNote.replace("{display}", displayCurrency).replace("{charge}", currency)}</p> : null}
          <p className="mt-4 text-xs leading-5 text-slate-500">{copy.recalculationNote}</p>
        </aside>
      </form>
    </section>
  );
}
