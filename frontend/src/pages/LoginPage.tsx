import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import type { z } from "zod";

import { login } from "../services/authService";
import { loginSchema } from "../schemas/authSchemas";
import { useAuthStore } from "../stores/authStore";

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function submit(values: LoginForm) {
    setSubmitting(true);
    setError(null);
    try {
      const tokens = await login(values);
      setTokens(tokens.access_token, tokens.refresh_token);
      navigate("/account");
    } catch {
      setError("Email ou senha invalidos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-semibold">Login</h1>
      <form onSubmit={form.handleSubmit(submit)} className="mt-6 rounded-lg border border-slate-200 p-5 shadow-sm">
        {error ? <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-danger">{error}</div> : null}
        <label className="text-sm font-medium">
          Email
          <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary" type="email" {...form.register("email")} />
          {form.formState.errors.email ? <span className="mt-1 block text-xs text-danger">Informe um email valido.</span> : null}
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-primary" type="password" {...form.register("password")} />
          {form.formState.errors.password ? <span className="mt-1 block text-xs text-danger">Use ao menos 8 caracteres.</span> : null}
        </label>
        <button disabled={submitting} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-white disabled:bg-slate-300">
          <LogIn className="h-4 w-4" />
          Entrar
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Ainda nao tem conta? <Link to="/register" className="font-semibold text-primary">Criar cadastro</Link>
      </p>
    </section>
  );
}
