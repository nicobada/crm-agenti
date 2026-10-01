"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { LogIn, Eye, EyeOff, Mail, Lock, Shield, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Credenziali non valide o errore di connessione.");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError("");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Background Glow Decorations */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-600/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/25 text-white">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              CRM Agenti
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Accedi alla piattaforma per gestire ordini e provvigioni
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-sm font-medium text-rose-700 animate-in fade-in">
              <Shield className="h-5 w-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email Aziendale
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="nome@azienda.it"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? "Nascondi password" : "Mostra password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-600/35 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Accedi al Sistema</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Account di Prova Rapidi
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill("admin@crm.local", "admin123")}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs transition-all hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800"
              >
                <span className="font-bold text-slate-800">Admin</span>
                <span className="text-[10px] text-slate-500">admin@crm.local</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill("agent@crm.local", "agent123")}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs transition-all hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800"
              >
                <span className="font-bold text-slate-800">Agente</span>
                <span className="text-[10px] text-slate-500">agent@crm.local</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          CRM Agenti &copy; 2026 &bull; Conforme GDPR Art. 30
        </p>
      </div>
    </div>
  );
}
