"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useOrder, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useIsAdmin } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, FileText, CheckCircle2, User, Euro, Calendar, ShoppingBag, Shield } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function safeAmount(value: any): string {
  if (value === null || value === undefined) return "0.00";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: "In Attesa", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  CONFIRMED: { label: "Confermato", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  PROCESSING: { label: "In Lavorazione", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  SHIPPED: { label: "Spedito", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  DELIVERED: { label: "Consegnato", bg: "bg-teal-50 border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
  INVOICED: { label: "Fatturato", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  PAID: { label: "Pagato", bg: "bg-slate-100 border-slate-200", text: "text-slate-700", dot: "bg-slate-500" },
  CANCELLED: { label: "Annullato", bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
};

interface OrderDetailModalProps {
  orderId: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function OrderDetailModal({ orderId, open, onOpenChange, onClose }: OrderDetailModalProps) {
  const isOpen = open !== undefined ? open : !!orderId;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (!newOpen && onClose) onClose();
  };

  const { data: order, isLoading } = useOrder(orderId);
  const isAdmin = useIsAdmin();
  const updateStatus = useUpdateOrderStatus();
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: fullOrder } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await apiClient.get(`/orders/${orderId}`);
      return data;
    },
    enabled: !!orderId && isOpen,
  });

  const currentOrder = fullOrder || order;

  const handleStatusChange = async () => {
    if (!orderId || !status) return;
    setFeedback(null);
    try {
      await updateStatus.mutateAsync({ id: orderId, status });
      setFeedback("Stato aggiornato e magazzino sincronizzato!");
      setStatus("");
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback("Errore durante l'aggiornamento dello stato.");
    }
  };

  const statusOptions = [
    { value: "CONFIRMED", label: "Confermato (Scarica lo Stock)" },
    { value: "PROCESSING", label: "In lavorazione" },
    { value: "SHIPPED", label: "Spedito" },
    { value: "DELIVERED", label: "Consegnato" },
    { value: "INVOICED", label: "Fatturato" },
    { value: "PAID", label: "Pagato" },
    { value: "PENDING", label: "In attesa" },
    { value: "CANCELLED", label: "Annullato (Ripristina lo Stock)" },
  ];

  const currentStatusConfig = currentOrder
    ? STATUS_CONFIG[currentOrder.status] || {
        label: currentOrder.status,
        bg: "bg-slate-100 border-slate-200",
        text: "text-slate-700",
        dot: "bg-slate-500",
      }
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 p-6 sm:p-8">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                  Ordine {currentOrder?.orderNumber || "—"}
                </DialogTitle>
                <p className="text-xs text-slate-400">
                  Registrato il{" "}
                  {currentOrder?.createdAt
                    ? new Date(currentOrder.createdAt).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            {currentStatusConfig && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
                  currentStatusConfig.bg,
                  currentStatusConfig.text
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", currentStatusConfig.dot)} />
                {currentStatusConfig.label}
              </span>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto mb-2" />
            <p className="text-xs text-slate-400">Caricamento dettagli...</p>
          </div>
        ) : !currentOrder ? (
          <div className="py-12 text-center text-sm font-semibold text-slate-500">
            Ordine non trovato
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {/* Overview Metric Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Cliente
                </span>
                <span className="mt-1 text-sm font-bold text-slate-900 block truncate">
                  {currentOrder.client?.name || "N/D"}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Agente
                </span>
                <span className="mt-1 text-sm font-bold text-slate-900 block truncate">
                  {currentOrder.agent?.user?.lastName
                    ? `${currentOrder.agent.user.firstName || ""} ${currentOrder.agent.user.lastName}`
                    : currentOrder.agent?.code || "N/D"}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Totale Ordine
                </span>
                <span className="mt-1 text-sm font-black text-slate-900 block">
                  {safeAmount(currentOrder.totalAmount)} €
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Articoli Totali
                </span>
                <span className="mt-1 text-sm font-bold text-slate-900 block">
                  {currentOrder.items?.length || 0} righe
                </span>
              </div>
            </div>

            {/* Provvigione Box */}
            {currentOrder.commissions && currentOrder.commissions.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Provvigione Agente ({currentOrder.commissions[0].percentage}%)
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-emerald-900">
                    {safeAmount(currentOrder.commissions[0].amount)} €
                  </p>
                </div>
                <div>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
                      currentOrder.commissions[0].status === "PAID"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : currentOrder.commissions[0].status === "APPROVED"
                        ? "bg-blue-100 border-blue-300 text-blue-800"
                        : "bg-amber-100 border-amber-300 text-amber-800"
                    )}
                  >
                    {currentOrder.commissions[0].status === "PAID"
                      ? "Pagata"
                      : currentOrder.commissions[0].status === "APPROVED"
                      ? "Approvata"
                      : "In Attesa"}
                  </span>
                </div>
              </div>
            )}

            {/* Note Ordine (se presenti) */}
            {currentOrder.notes && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
                <span className="font-bold text-slate-600 block mb-1 uppercase tracking-wider text-[10px]">
                  Note Ordine
                </span>
                <p className="text-slate-700 italic">{currentOrder.notes}</p>
              </div>
            )}

            {/* Status Manager for Admins */}
            {isAdmin && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cambio Stato Operativo & Magazzino
                  </span>
                </div>
                {feedback && (
                  <div className="mb-3 rounded-xl bg-emerald-100 border border-emerald-300 p-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={14} /> {feedback}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Seleziona nuovo stato --</option>
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusChange}
                    disabled={!status || updateStatus.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Save className="h-4 w-4" /> Aggiorna
                  </button>
                </div>
              </div>
            )}

            {/* Products Table */}
            {currentOrder.items && currentOrder.items.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Articoli dell'Ordine
                </h4>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/80">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase text-[10px]">
                          Prodotto
                        </th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-500 uppercase text-[10px]">
                          Q.tà
                        </th>
                        <th className="px-3 py-2.5 text-right font-bold text-slate-500 uppercase text-[10px]">
                          Prezzo
                        </th>
                        <th className="px-3 py-2.5 text-center font-bold text-slate-500 uppercase text-[10px]">
                          Sconto
                        </th>
                        <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase text-[10px]">
                          Totale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentOrder.items.map((item: any, idx: number) => {
                        const rowTotal =
                          (item.quantity || 0) *
                          (item.unitPrice || 0) *
                          (1 - (item.discount || 0) / 100);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {item.productName || item.product?.name || "Prodotto"}
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-slate-700">
                              {item.quantity || 0} pz
                            </td>
                            <td className="px-3 py-3 text-right text-slate-600">
                              {safeAmount(item.unitPrice)} €
                            </td>
                            <td className="px-3 py-3 text-center text-slate-500">
                              {item.discount ? `${item.discount}%` : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-emerald-600">
                              {safeAmount(rowTotal)} €
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Documenti Allegati
              </h4>
              {currentOrder.documents && currentOrder.documents.length > 0 ? (
                <div className="grid gap-2">
                  {currentOrder.documents.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group"
                    >
                      <FileText className="text-slate-400 group-hover:text-emerald-600" size={18} />
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-emerald-700">
                        {doc.fileName}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nessun allegato presente per questo ordine.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}