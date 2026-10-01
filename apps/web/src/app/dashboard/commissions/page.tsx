"use client";

import { useCommissions, usePayCommission, useApproveCommission } from "@/hooks/use-commissions";
import { useIsAdmin } from "@/hooks/use-auth";
import { Euro, FileText, CheckCircle2, Clock, Shield, Check, Wallet } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

function safeAmount(value: any): string {
  if (value === null || value === undefined) return "0.00";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CommissionsPage() {
  const { data: commissions, isLoading } = useCommissions();
  const isAdmin = useIsAdmin();
  const payMutation = usePayCommission();
  const approveMutation = useApproveCommission();
  const [statusFilter, setStatusFilter] = useState("ALL");

  const handlePay = async (id: string) => {
    if (confirm("Sei sicuro di voler contrassegnare questa provvigione come PAGATA?")) {
      try {
        await payMutation.mutateAsync(id);
      } catch {
        alert("Errore durante la registrazione del pagamento");
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
    } catch {
      alert("Errore durante l'approvazione");
    }
  };

  const filteredCommissions = useMemo(() => {
    if (!commissions) return [];
    if (statusFilter === "ALL") return commissions;
    return commissions.filter((c) => c.status === statusFilter);
  }, [commissions, statusFilter]);

  const totalCommissions = useMemo(
    () => commissions?.reduce((acc, c) => acc + (Number(c.amount) || 0), 0) ?? 0,
    [commissions]
  );
  const pendingCommissions = useMemo(
    () =>
      commissions
        ?.filter((c) => c.status === "PENDING")
        .reduce((acc, c) => acc + (Number(c.amount) || 0), 0) ?? 0,
    [commissions]
  );
  const paidCommissions = useMemo(
    () =>
      commissions
        ?.filter((c) => c.status === "PAID")
        .reduce((acc, c) => acc + (Number(c.amount) || 0), 0) ?? 0,
    [commissions]
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Registro Provvigioni & Compensi
        </h1>
        <p className="text-sm text-slate-500">
          Monitoraggio, approvazione e liquidazione delle spettanze provvigionali maturate
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Totale Spettanze
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Euro className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {totalCommissions.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              In Attesa di Liquidazione
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {pendingCommissions.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Saldate & Pagate
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {paidCommissions.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm overflow-x-auto">
        {[
          { id: "ALL", label: "Tutte le Provvigioni" },
          { id: "PENDING", label: "In Attesa" },
          { id: "APPROVED", label: "Approvate" },
          { id: "PAID", label: "Pagate" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
              statusFilter === tab.id
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/80">
            <tr>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Dettaglio Ordine & Cliente
              </th>
              {isAdmin && (
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Agente
                </th>
              )}
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Base Ordine
              </th>
              <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Quota %
              </th>
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Provvigione
              </th>
              <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Stato
              </th>
              <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Data
              </th>
              {isAdmin && (
                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  Azioni Amministrative
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCommissions.map((commission) => (
              <tr key={commission.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-900 text-sm">
                    {commission.clientName !== "N/A" ? (
                      commission.clientName
                    ) : (
                      <span className="italic text-slate-400">Nessun cliente</span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] font-bold text-slate-400 mt-0.5">
                    {commission.orderNumber || "ORD-N/D"}
                  </div>
                </td>

                {isAdmin && (
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{commission.agentName}</div>
                    <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 mt-0.5">
                      {commission.agentCode}
                    </span>
                  </td>
                )}

                <td className="p-4 text-right font-semibold text-slate-600">
                  {safeAmount(commission.orderTotal)} €
                </td>
                <td className="p-4 text-center font-bold text-indigo-600">
                  {safeAmount(commission.percentage)}%
                </td>
                <td className="p-4 text-right font-black text-emerald-600 text-sm">
                  {safeAmount(commission.amount)} €
                </td>

                <td className="p-4 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase",
                      commission.status === "PAID"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : commission.status === "APPROVED"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        commission.status === "PAID"
                          ? "bg-emerald-500"
                          : commission.status === "APPROVED"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      )}
                    />
                    {commission.status === "PAID"
                      ? "Pagata"
                      : commission.status === "APPROVED"
                      ? "Approvata"
                      : "In Attesa"}
                  </span>
                </td>

                <td className="p-4 text-center text-xs text-slate-400">
                  {commission.createdAt
                    ? new Date(commission.createdAt).toLocaleDateString("it-IT")
                    : "—"}
                </td>

                {isAdmin && (
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {commission.status === "PENDING" && (
                        <button
                          onClick={() => handleApprove(commission.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                          title="Approva provvigione"
                        >
                          <Check size={12} /> Approva
                        </button>
                      )}

                      {commission.status !== "PAID" && (
                        <button
                          onClick={() => handlePay(commission.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="Segna come Pagata"
                        >
                          <Wallet size={12} /> Salda
                        </button>
                      )}

                      {commission.status === "PAID" && (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-center gap-1">
                          <CheckCircle2 size={13} /> Liquidata
                        </span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCommissions.length === 0 && (
          <div className="py-16 text-center">
            <Euro className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Nessuna provvigione trovata</p>
            <p className="text-xs text-slate-400 mt-1">
              I compensi maturati sui nuovi ordini verranno riepilogati qui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}