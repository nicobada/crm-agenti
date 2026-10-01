"use client";

import { useCommissions, usePayCommission, useApproveCommission } from "@/hooks/use-commissions";
import { useIsAdmin } from "@/hooks/use-auth";
import { Euro } from "lucide-react";
import { cn } from "@/lib/utils";

function safeAmount(value: any): string {
  if (value === null || value === undefined) return "0.00";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

export function CommissionReportTable() {
  const { data: commissions, isLoading } = useCommissions();
  const isAdmin = useIsAdmin();
  const payMutation = usePayCommission();
  const approveMutation = useApproveCommission();

  const handlePay = async (id: string) => {
    try { await payMutation.mutateAsync(id); } catch { alert("Errore"); }
  };

  const handleApprove = async (id: string) => {
    try { await approveMutation.mutateAsync(id); } catch { alert("Errore"); }
  };

  if (isLoading) return <div>Caricamento...</div>;

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left font-medium text-gray-500">Cliente</th>
            <th className="px-6 py-4 text-left font-medium text-gray-500">Ordine</th>
            <th className="px-6 py-4 text-right font-medium text-gray-500">Totale Ordine</th>
            <th className="px-6 py-4 text-right font-medium text-gray-500">%</th>
            <th className="px-6 py-4 text-right font-medium text-gray-500">Importo</th>
            <th className="px-6 py-4 text-center font-medium text-gray-500">Stato</th>
            <th className="px-6 py-4 text-center font-medium text-gray-500">Data</th>
            {isAdmin && <th className="px-6 py-4 text-center font-medium text-gray-500">Azioni</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {commissions?.map((commission) => (
            <tr key={commission.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">
                {commission?.clientName && commission.clientName !== "N/A" ? commission.clientName : <span className="italic text-gray-400">N/A</span>}
              </td>
              <td className="px-6 py-4 text-gray-600">{commission?.orderId || "—"}</td>
              <td className="px-6 py-4 text-right font-medium">{safeAmount(commission?.orderTotal)} €</td>
              <td className="px-6 py-4 text-right text-gray-600">{safeAmount(commission?.percentage)}%</td>
              <td className="px-6 py-4 text-right font-bold text-emerald-600">{safeAmount(commission?.amount)} €</td>
              <td className="px-6 py-4 text-center">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium",
                  commission?.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                  commission?.status === "APPROVED" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                )}>
                  {commission?.status === "PAID" ? "Pagata" : commission?.status === "APPROVED" ? "Approvata" : "In attesa"}
                </span>
              </td>
              <td className="px-6 py-4 text-center text-gray-500">{commission?.createdAt ? new Date(commission.createdAt).toLocaleDateString("it-IT") : "—"}</td>
              {isAdmin && (
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {commission?.status === "PENDING" && (
                      <button onClick={() => handleApprove(commission.id)} disabled={approveMutation.isPending}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">Approva</button>
                    )}
                    {(commission?.status === "PENDING" || commission?.status === "APPROVED") && (
                      <button onClick={() => handlePay(commission.id)} disabled={payMutation.isPending}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                        <Euro className="h-3 w-3" /> Paga
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {(!commissions || commissions.length === 0) && (
        <div className="py-12 text-center text-gray-400">Nessuna commissione trovata</div>
      )}
    </div>
  );
}
