import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import type { z } from "zod";

import { register } from "../services/authService";
import { login } from "../services/authService";
import { registerSchema } from "../schemas/authSchemas";
import { useAuthStore } from "../stores/authStore";

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function submit(values: RegisterForm) {
    setSubmitting(true);
    setError(null);
    try {
      await register(values);
      const tokens = await login({ email: values.email, password: values.password });
      setTokens(tokens.access_token, tokens.refresh_token);
      navigate("/account");
    } catch {
      setError("Nao foi possivel criar a conta. Talvez esse email ja esteja cadastrado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Criar conta</h1>
      <form onSubmit={form.handleSubmit(submit)} className="mt-6 grid gap-4 rounded-lg border border-slate-200 p-5 shadow-sm md:grid-cols-2">
        {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-danger md:col-span-2">{error}</div> : null}
        <label className="text-sm font-medium">
          First name
          <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary" {...form.register("first_name")} />
        </label>
        <label className="text-sm font-medium">
          Last name
          <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary" {...form.register("last_name")} />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Email
          <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary" type="email" {...form.register("email")} />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Password
          <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary" type="password" {...form.register("password")} />
          {Object.keys(form.formState.errors).length ? <span className="mt-1 block text-xs text-danger">Preencha os campos corretamente.</span> : null}
        </label>
        <button disabled={submitting} className="flex h-11 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-white disabled:bg-slate-300 md:col-span-2">
          <UserPlus className="h-4 w-4" />
          Criar conta
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Ja tem conta? <Link to="/login" className="font-semibold text-primary">Entrar</Link>
      </p>
    </section>
  );
}
