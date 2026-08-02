import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Loader2, MapPin, PackageCheck, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { calculateCheckout, createOrder, createPaymentSession } from "../services/checkoutService";
import { checkoutAddressSchema, type CheckoutAddressForm } from "../schemas/checkoutSchemas";
import { useCartStore } from "../stores/cartStore";
import type { CheckoutCalculation } from "../types/checkout";
import { formatMoney } from "../utils/currency";

const defaultAddress: CheckoutAddressForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country: "US",
  state: "",
  city: "",
  address_line1: "",
  address_line2: "",
  district: "",
  postal_code: "",
  notes: "",
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
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
      setError(err instanceof Error ? err.message : "Unable to calculate checkout.");
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
    if (watchedCountry?.toUpperCase() !== "BR" || digits.length !== 8) return;
    const timeout = window.setTimeout(async () => {
      setCepStatus("Looking up postal code...");
      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await response.json();
        if (data.erro) {
          setCepStatus("Postal code not found.");
          return;
        }
        form.setValue("state", data.uf ?? "", { shouldValidate: true });
        form.setValue("city", data.localidade ?? "", { shouldValidate: true });
        if (data.logradouro) form.setValue("address_line1", data.logradouro, { shouldValidate: true });
        if (data.bairro) form.setValue("district", data.bairro, { shouldValidate: true });
        setCepStatus("Address filled from postal code. Add the street number.");
      } catch {
        setCepStatus("Unable to look up postal code.");
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
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <Link to="/catalog" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white">
            Browse catalog
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
            <p className="mt-3 font-semibold">Creating secure payment session...</p>
            <p className="mt-1 text-sm text-slate-600">Please do not close or refresh this page.</p>
          </div>
        </div>
      ) : null}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {[
            ["Identification", MapPin],
            ["Address", MapPin],
            ["Delivery", Truck],
            ["Payment", CreditCard],
            ["Review", PackageCheck],
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
              {[
                ["first_name", "First name"],
                ["last_name", "Last name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["country", "Country code"],
                ["state", "State / Province"],
                ["city", "City"],
                ["postal_code", "Postal code"],
                ["address_line1", "Address"],
                ["address_line2", "Complement"],
                ["district", "District"],
              ].map(([name, label]) => (
                <label key={name} className={name === "address_line1" ? "text-sm font-medium md:col-span-2" : "text-sm font-medium"}>
                  {label}
                  <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary" {...form.register(name as keyof CheckoutAddressForm)} />
                  {form.formState.errors[name as keyof CheckoutAddressForm] ? <span className="mt-1 block text-xs text-danger">Invalid field</span> : null}
                </label>
              ))}
              {cepStatus ? <p className="text-sm text-slate-600 md:col-span-2">{cepStatus}</p> : null}
              <label className="text-sm font-medium md:col-span-2">
                Notes
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" {...form.register("notes")} />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="text-lg font-semibold">Delivery method</h2>
              <div className="mt-4 grid gap-3">
                {(calculation?.shipping_methods ?? []).map((method) => (
                  <label key={method.code} className={`flex cursor-pointer items-center justify-between gap-4 rounded-md border p-4 ${shippingMethodCode === method.code ? "border-primary bg-blue-50" : "border-slate-200"}`}>
                    <span>
                      <span className="block font-semibold">{method.name}</span>
                      <span className="mt-1 block text-sm text-slate-600">{method.min_days}-{method.max_days} business days</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{Number(method.amount) === 0 ? "Free" : formatMoney(Number(method.amount), method.currency)}</span>
                      <input type="radio" checked={shippingMethodCode === method.code} onChange={() => selectShippingMethod(method.code)} />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h2 className="text-lg font-semibold">Payment</h2>
              <div className="mt-4 rounded-md border border-slate-200 p-4 text-sm text-slate-600">
                After placing the order, Nexora creates a secure Stripe Checkout session. If production Stripe keys are not configured yet, the order stays pending without charging a card.
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <h2 className="text-lg font-semibold">Review order</h2>
              <div className="mt-4 space-y-3">
                {calculation?.items.map((item) => (
                  <div key={item.variant_id} className="flex justify-between gap-4 rounded-md bg-mist p-3 text-sm">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span>{formatMoney(Number(item.total_price), item.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex justify-between gap-3">
            <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm disabled:text-slate-300" disabled={step === 1 || submitting} onClick={() => setStep((value) => value - 1)}>
              Back
            </button>
            {step < 5 ? (
              <button type="button" disabled={loading || submitting} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" onClick={continueCheckout}>
                {loading ? "Checking..." : "Continue"}
              </button>
            ) : (
              <button type="submit" disabled={submitting || loading} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
                {submitting ? "Redirecting..." : "Place order"}
              </button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Summary</h2>
          <div className="mt-4 flex gap-2">
            <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm uppercase outline-none" placeholder="Coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} />
            <button type="button" disabled={loading || submitting} className="rounded-md border border-slate-200 px-3 text-sm font-semibold disabled:text-slate-300" onClick={applyCoupon}>
              Apply
            </button>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{formatMoney(Number(totals?.subtotal_amount ?? 0), currency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Discount</span><span>{formatMoney(Number(totals?.discount_amount ?? 0), currency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span>{formatMoney(Number(totals?.shipping_amount ?? 0), currency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Taxes</span><span>{formatMoney(Number(totals?.tax_amount ?? 0), currency)}</span></div>
            <div className="border-t border-slate-200 pt-3 text-base font-semibold">
              <div className="flex justify-between"><span>Total</span><span>{formatMoney(Number(totals?.total_amount ?? 0), currency)}</span></div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">The backend recalculates product prices, discounts, shipping and stock before creating the order.</p>
        </aside>
      </form>
    </section>
  );
}
