"use client";

import { useLogs } from "@/hooks/use-logs";
import { useIsAdmin } from "@/hooks/use-auth";
import { ShieldAlert, Activity, FileText, ShieldCheck, Clock, User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  CREATE: { label: "Creazione", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  UPDATE_STATUS: { label: "Cambio Stato", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  APPROVE: { label: "Approvazione", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  PAY: { label: "Liquidazione", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
};

export default function LogsPage() {
  const { data: logs, isLoading, error } = useLogs();
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Accesso Riservato</h2>
        <p className="text-sm text-slate-500 mt-1">
          Il registro di audit è accessibile esclusivamente agli amministratori per motivi di conformità.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-bold text-rose-700">
        Errore durante il caricamento del registro di audit.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
              <ShieldCheck size={12} /> GDPR Art. 30 Compliant
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Audit Log di Sistema
          </h1>
          <p className="text-sm text-slate-500">
            Tracciamento immutabile di tutte le transazioni, ordini e variazioni di magazzino
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/80">
            <tr>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Timestamp
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Operatore
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Azione Svolta
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Entità
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Dettaglio Operazione
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs?.map((log) => {
              const actionCfg = ACTION_CONFIG[log.action] || {
                label: log.action,
                bg: "bg-slate-100 border-slate-200",
                text: "text-slate-700",
              };

              return (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("it-IT")}
                  </td>
                  <td className="p-4 font-bold text-slate-800 text-xs sm:text-sm">
                    {log.userEmail}
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        actionCfg.bg,
                        actionCfg.text
                      )}
                    >
                      {actionCfg.label}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs font-bold text-slate-500 uppercase">
                    {log.entity}
                  </td>
                  <td className="p-4 text-xs text-slate-600 font-medium max-w-md">
                    {log.details || "Nessun dettaglio specificato"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!logs || logs.length === 0) && (
          <div className="py-16 text-center">
            <FileText className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Il registro è vuoto</p>
            <p className="text-xs text-slate-400 mt-1">
              Tutte le modifiche a ordini, stock e provvigioni verranno annotate qui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}