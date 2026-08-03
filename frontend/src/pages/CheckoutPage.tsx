import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CreditCard, Loader2, MapPin, PackageCheck, ShieldCheck, Truck } from "lucide-react";
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
    recalculationNote: "Your total is checked again before payment.",
    postalLooking: "Looking up postal code...",
    postalNotFound: "Postal code not found.",
    postalFilled: "Address filled from postal code. Add the street number.",
    postalFailed: "Unable to look up postal code.",
    secureSummary: "Protected session",
    secureSummaryCopy: "Your payment details are handled by Stripe.",
    deliverySummary: "Real delivery",
    deliverySummaryCopy: "We check delivery options for your address before payment.",
    reviewSummary: "Final review",
    reviewSummaryCopy: "You approve totals and routing before payment starts.",
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
    secureSummary: "Pagamento seguro",
    secureSummaryCopy: "Seus dados de pagamento ficam protegidos pelo Stripe.",
    deliverySummary: "Entrega confirmada",
    deliverySummaryCopy: "Consultamos as opcoes disponiveis para o seu endereco antes do pagamento.",
    reviewSummary: "Revisao do pedido",
    reviewSummaryCopy: "Voce confere os itens, entrega e total antes de pagar.",
  },
  es: {
    checkout: "Finalizar compra",
    identification: "Identificación",
    address: "Dirección",
    delivery: "Entrega",
    payment: "Pago",
    review: "Revisión",
    emptyCart: "Tu carrito está vacío",
    browseCatalog: "Ver catálogo",
    creatingPayment: "Creando pago seguro...",
    doNotClose: "No cierres ni actualices esta página.",
    invalidField: "Campo inválido",
    notes: "Notas",
    deliveryMethod: "Método de entrega",
    businessDays: "días hábiles",
    trackingAvailable: "Rastreo disponible",
    trackingUnavailable: "Rastreo no informado",
    free: "Gratis",
    paymentInfo: "Después de realizar el pedido, Nexora crea una sesión segura de pago en Stripe. Si las claves de producción aún no están configuradas, el pedido queda pendiente sin cobrar la tarjeta.",
    reviewOrder: "Revisar pedido",
    back: "Volver",
    checking: "Verificando...",
    continue: "Continuar",
    redirecting: "Redirigiendo...",
    placeOrder: "Realizar pedido",
    summary: "Resumen",
    coupon: "Cupón",
    apply: "Aplicar",
    subtotal: "Subtotal",
    discount: "Descuento",
    shipping: "Envío",
    taxes: "Impuestos",
    total: "Total",
    currencyNote: "Valores mostrados en {display}. El cobro final se procesa en {charge}.",
    recalculationNote: "El sistema recalcula precios, descuentos, envío y stock antes de crear el pedido.",
    postalLooking: "Consultando código postal...",
    postalNotFound: "Código postal no encontrado.",
    postalFilled: "Dirección completada por código postal. Agrega el número.",
    postalFailed: "No se pudo consultar el código postal.",
    secureSummary: "Sesión protegida",
    secureSummaryCopy: "Checkout cifrado con validación final antes del pago.",
    deliverySummary: "Recalculo del envío",
    deliverySummaryCopy: "Destino y método se revisan antes de crear el pedido.",
    reviewSummary: "Revisión final",
    reviewSummaryCopy: "Apruebas totales y ruta del pedido antes de iniciar el pago.",
  },
};

const localizedIdentityFields: Record<Language, Array<[keyof CheckoutAddressForm, string]>> = {
  en: [["first_name", "First name"], ["last_name", "Last name"], ["email", "E-mail"], ["phone", "Phone"]],
  pt: identityFields,
  es: [["first_name", "Nombre"], ["last_name", "Apellido"], ["email", "E-mail"], ["phone", "Teléfono"]],
};

const localizedAddressFields: Record<Language, Array<[keyof CheckoutAddressForm, string]>> = {
  en: [["country", "Country"], ["postal_code", "Postal code"], ["state", "State/Province"], ["city", "City"], ["district", "District"], ["address_line1", "Address"], ["address_line2", "Complement"]],
  pt: addressFields,
  es: [["country", "País"], ["postal_code", "Código postal"], ["state", "Estado/Provincia"], ["city", "Ciudad"], ["district", "Barrio"], ["address_line1", "Dirección"], ["address_line2", "Complemento"]],
};

function shippingDisplayName(name: string, code: string, language: Language) {
  const source = `${name} ${code}`.toLowerCase();
  if (source.includes("postal") || source.includes("postnl")) {
    return language === "pt" ? "Envio postal internacional" : language === "es" ? "Envío postal internacional" : "International postal shipping";
  }
  if (source.includes("special") || source.includes("liquid") || source.includes("line")) {
    return language === "pt" ? "Envio rastreado" : language === "es" ? "Envío con rastreo" : "Tracked shipping";
  }
  return language === "pt" ? "Envio econômico" : language === "es" ? "Envío económico" : "Economy shipping";
}

function customerMessage(message: string) {
  if (message.includes("Enter the delivery address")) return "Informe seu endereco de entrega para verificar disponibilidade e frete.";
  if (message.includes("AliExpress shipping error") || message.includes("aeopFreightCalculateForBuyerDTO")) return "Nao foi possivel calcular a entrega deste item pelo fornecedor. Confira o endereco ou tente outro produto.";
  if (message.includes("CJ did not return") || message.includes("shipping quote")) return "Ainda nao temos entrega disponivel para esse endereco com os produtos do carrinho. Confira o CEP ou escolha outro produto.";
  if (message.includes("Delivery is not available")) return "Ainda nao temos entrega disponivel para esse endereco com os produtos do carrinho. Confira se o pais, CEP, estado e cidade estao corretos.";
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
  }, [watchedPostalCode, watchedCountry, form, copy.postalFailed, copy.postalFilled, copy.postalLooking, copy.postalNotFound]);

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
      <section className="section-space">
        <div className="shell">
          <div className="panel mx-auto max-w-3xl p-10 text-center md:p-16">
            <p className="eyebrow">Checkout</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">{copy.emptyCart}</h1>
            <Link to="/catalog" className="btn-primary mt-8">
              {copy.browseCatalog}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const totals = calculation?.totals;
  const currency = totals?.currency ?? items[0]?.currency ?? "USD";

  const stepItems = [
    { label: copy.identification, icon: MapPin, index: 1 },
    { label: copy.address, icon: MapPin, index: 2 },
    { label: copy.delivery, icon: Truck, index: 3 },
    { label: copy.payment, icon: CreditCard, index: 4 },
    { label: copy.review, icon: PackageCheck, index: 5 },
  ];

  return (
    <section className="relative section-space pt-8">
      {submitting ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#f7f5f0]/90 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-8 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-900" />
            <p className="mt-4 text-lg font-semibold text-slate-950">{copy.creatingPayment}</p>
            <p className="mt-2 text-sm text-slate-600">{copy.doNotClose}</p>
          </div>
        </div>
      ) : null}

      <div className="shell">
        <div className="mb-8 border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow">{language === "pt" ? "Compra segura" : language === "es" ? "Compra segura" : "Secure checkout"}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-5xl">{copy.checkout}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                {language === "pt"
                  ? "Confirme seus dados, confira a entrega disponivel para o seu endereco e finalize o pagamento em ambiente protegido."
                  : language === "es"
                    ? "Confirma tus datos, revisa la entrega disponible para tu direccion y finaliza el pago en un ambiente protegido."
                    : "Confirm your details, review delivery for your address and finish payment in a protected checkout."}
              </p>
            </div>

            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3 lg:w-[520px]">
              <div className="border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-950">{copy.secureSummary}</p>
              </div>
              <div className="border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-950">{copy.deliverySummary}</p>
              </div>
              <div className="border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-950">{copy.reviewSummary}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-5">
          {stepItems.map((item) => {
            const Icon = item.icon;
            const isActive = step === item.index;
            const isDone = step > item.index;
            return (
              <button
                key={item.label}
                disabled={submitting || loading}
                className={`flex min-h-[88px] items-center gap-4 border px-4 py-4 text-left transition disabled:opacity-60 ${isActive ? "border-slate-950 bg-slate-950 text-white" : isDone ? "border-slate-300 bg-white text-slate-900" : "border-slate-200 bg-[#f8f6f1] text-slate-600"}`}
                onClick={() => goToStep(item.index)}
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center border ${isActive ? "border-white/20 bg-white/10" : "border-slate-300 bg-white"}`}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </span>
                <span>
                  <span className="block text-[11px] uppercase tracking-[0.2em] opacity-70">0{item.index}</span>
                  <span className="mt-1 block text-sm font-semibold">{item.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={form.handleSubmit(submit)} className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="panel p-5 md:p-8">
            {error ? <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

            {step <= 2 ? (
              <div>
                <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 0{step}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{step === 1 ? copy.identification : copy.address}</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {(step === 1 ? localizedIdentityFields[language] : localizedAddressFields[language]).map(([name, label]) => (
                    <label key={name} className={name === "address_line1" ? "text-sm font-medium text-slate-700 md:col-span-2" : "text-sm font-medium text-slate-700"}>
                      <span>{label}</span>
                      <input className="input-clean mt-2" {...form.register(name as keyof CheckoutAddressForm)} />
                      {form.formState.errors[name as keyof CheckoutAddressForm] ? <span className="mt-2 block text-xs text-red-600">{copy.invalidField}</span> : null}
                    </label>
                  ))}
                  {cepStatus ? <p className="text-sm text-slate-600 md:col-span-2">{cepStatus}</p> : null}
                  <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    <span>{copy.notes}</span>
                    <textarea className="textarea-clean mt-2" {...form.register("notes")} />
                  </label>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 03</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{copy.deliveryMethod}</h2>
                  </div>
                </div>

                <div className="grid gap-3">
                  {(calculation?.shipping_methods ?? []).map((method) => (
                    <label key={method.code} className={`grid cursor-pointer gap-4 border p-5 transition md:grid-cols-[1fr_auto] ${shippingMethodCode === method.code ? "border-slate-950 bg-[#f6f4ee]" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <span>
                        <span className="block text-lg font-semibold text-slate-950">{shippingDisplayName(method.name, method.code, language)}</span>
                        <span className="mt-2 block text-sm text-slate-600">{method.min_days}-{method.max_days} {copy.businessDays}</span>
                        <span className="mt-2 block text-xs uppercase tracking-[0.2em] text-slate-400">{method.tracking_available ? copy.trackingAvailable : copy.trackingUnavailable}</span>
                      </span>
                      <span className="flex items-center gap-4 md:justify-end">
                        <span className="text-lg font-semibold text-slate-950">{Number(method.amount) === 0 ? copy.free : formatMoney(Number(method.amount), method.currency, displayCurrency)}</span>
                        <input type="radio" checked={shippingMethodCode === method.code} onChange={() => selectShippingMethod(method.code)} />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 04</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{copy.payment}</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                  <div className="border border-slate-200 bg-[#f8f6f1] p-5 text-sm leading-7 text-slate-600">{copy.paymentInfo}</div>
                  <div className="border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-1 h-5 w-5 text-slate-900" />
                      <div>
                        <p className="font-semibold text-slate-950">Stripe / secure session</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {language === "pt" ? "O redirecionamento acontece somente após a revisão final do pedido." : language === "es" ? "La redirección ocurre solo después de la revisión final del pedido." : "Redirection only happens after the final order review."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div>
                <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 05</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{copy.reviewOrder}</h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {calculation?.items.map((item) => (
                    <div key={item.variant_id} className="flex items-center justify-between gap-4 border border-slate-200 bg-[#f8f6f1] p-4 text-sm">
                      <span>
                        <span className="block font-semibold text-slate-950">{item.product_name}</span>
                        <span className="mt-1 block text-slate-500">{item.variant_sku} · {item.quantity}x</span>
                      </span>
                      <span className="font-semibold text-slate-950">{formatMoney(Number(item.total_price), item.currency, displayCurrency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6">
              <button type="button" className="btn-secondary px-5 py-3 disabled:border-slate-200 disabled:text-slate-300" disabled={step === 1 || submitting} onClick={() => setStep((value) => value - 1)}>
                {copy.back}
              </button>
              {step < 5 ? (
                <button type="button" disabled={loading || submitting} className="btn-primary px-5 py-3 disabled:border-slate-300 disabled:bg-slate-300" onClick={continueCheckout}>
                  {loading ? copy.checking : copy.continue}
                </button>
              ) : (
                <button type="submit" disabled={submitting || loading} className="btn-primary px-5 py-3 disabled:border-slate-300 disabled:bg-slate-300">
                  {submitting ? copy.redirecting : copy.placeOrder}
                </button>
              )}
            </div>
          </div>

          <aside className="panel h-fit overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
              <h2 className="text-lg font-semibold tracking-[0.02em]">{copy.summary}</h2>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.coupon}</label>
                <div className="mt-3 flex gap-2">
                  <input className="input-clean min-w-0 flex-1 uppercase" placeholder={copy.coupon} value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} />
                  <button type="button" disabled={loading || submitting} className="btn-secondary px-4 disabled:border-slate-200 disabled:text-slate-300" onClick={applyCoupon}>
                    {copy.apply}
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">{copy.subtotal}</span>
                  <span className="font-medium text-slate-950">{formatMoney(Number(totals?.subtotal_amount ?? 0), currency, displayCurrency)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">{copy.discount}</span>
                  <span className="font-medium text-slate-950">{formatMoney(Number(totals?.discount_amount ?? 0), currency, displayCurrency)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">{copy.shipping}</span>
                  <span className="font-medium text-slate-950">{formatMoney(Number(totals?.shipping_amount ?? 0), currency, displayCurrency)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">{copy.taxes}</span>
                  <span className="font-medium text-slate-950">{formatMoney(Number(totals?.tax_amount ?? 0), currency, displayCurrency)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{copy.total}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{formatMoney(Number(totals?.total_amount ?? 0), currency, displayCurrency)}</p>
                  </div>
                  <div className="text-right text-xs leading-5 text-slate-500">{items.length} item(s)</div>
                </div>
              </div>

              {displayCurrency !== currency ? <p className="text-xs leading-5 text-slate-500">{copy.currencyNote.replace("{display}", displayCurrency).replace("{charge}", currency)}</p> : null}
              <p className="text-xs leading-5 text-slate-500">{copy.recalculationNote}</p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}
