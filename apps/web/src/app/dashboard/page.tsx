"use client";

import { RecentOrders } from "@/components/orders/recent-orders";
import { useCommissions } from "@/hooks/use-commissions";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import {
  Euro,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShoppingCart,
  Users,
  PlusCircle,
  UserPlus,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

function safeAmount(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  shadowColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  gradient: string;
  shadowColor: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform group-hover:scale-110",
            gradient,
            shadowColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: commissions } = useCommissions();
  const { data: orders } = useOrders();
  const { data: user } = useAuth();

  const totalCommissions = useMemo(
    () => commissions?.reduce((sum, c) => sum + safeAmount(c.amount), 0) ?? 0,
    [commissions]
  );
  const pendingCommissions = useMemo(
    () =>
      commissions
        ?.filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + safeAmount(c.amount), 0) ?? 0,
    [commissions]
  );
  const paidCommissions = useMemo(
    () =>
      commissions
        ?.filter((c) => c.status === "PAID")
        .reduce((sum, c) => sum + safeAmount(c.amount), 0) ?? 0,
    [commissions]
  );
  const avgOrder = useMemo(() => {
    return orders && orders.length > 0 ? totalCommissions / orders.length : 0;
  }, [orders, totalCommissions]);

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buongiorno";
    if (hour < 18) return "Buon pomeriggio";
    return "Buonasera";
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const userDisplayName = user?.firstName || user?.email?.split("@")[0] || "Utente";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{todayFormatted}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, {userDisplayName}!
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Tutte le metriche, gli ordini recenti e le provvigioni commerciali sono aggiornati in tempo reale.
            </p>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/orders?new=1"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/50 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nuovo Ordine</span>
            </Link>
            <Link
              href="/dashboard/clients?new=1"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-xs sm:text-sm font-bold text-white border border-white/20 transition-all hover:bg-white/20 active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Aggiungi Cliente</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Totale Provvigioni"
          value={`${totalCommissions.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          subtitle="Compensi maturati"
          icon={Euro}
          gradient="bg-gradient-to-tr from-blue-600 to-indigo-500"
          shadowColor="shadow-blue-500/25"
        />
        <StatCard
          title="Provvigioni In Attesa"
          value={`${pendingCommissions.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          subtitle="Da liquidare"
          icon={Clock}
          gradient="bg-gradient-to-tr from-amber-500 to-orange-500"
          shadowColor="shadow-amber-500/25"
        />
        <StatCard
          title="Provvigioni Pagate"
          value={`${paidCommissions.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          subtitle="Liquidate con successo"
          icon={CheckCircle2}
          gradient="bg-gradient-to-tr from-emerald-600 to-teal-500"
          shadowColor="shadow-emerald-500/25"
        />
        <StatCard
          title="Media per Ordine"
          value={`${avgOrder.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          subtitle="Rendimento medio"
          icon={TrendingUp}
          gradient="bg-gradient-to-tr from-purple-600 to-pink-500"
          shadowColor="shadow-purple-500/25"
        />
      </div>

      {/* Main Grid: Recent Orders & Quick Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>

        {/* Right Column Summary Cards */}
        <div className="space-y-6">
          {/* Total Orders Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Volume Ordini</h3>
                  <p className="text-xs text-slate-400">Tutti gli ordini registrati</p>
                </div>
              </div>
              <Link
                href="/dashboard/orders"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                title="Vedi tutti gli ordini"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900">{orders?.length ?? 0}</p>
              <span className="text-xs font-semibold text-slate-400">ordini complessivi</span>
            </div>
          </div>

          {/* Total Commissions Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Righe Provvigione</h3>
                  <p className="text-xs text-slate-400">Ripartizioni generate</p>
                </div>
              </div>
              <Link
                href="/dashboard/commissions"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                title="Vedi tutte le provvigioni"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900">{commissions?.length ?? 0}</p>
              <span className="text-xs font-semibold text-slate-400">quote provvigionali</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
