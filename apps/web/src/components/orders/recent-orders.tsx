"use client";

import { useRecentOrders } from "@/hooks/use-orders";
import { Eye, ArrowRight, ShoppingBag, Package } from "lucide-react";
import { useState } from "react";
import { OrderDetailModal } from "./order-detail-modal";
import Link from "next/link";
import { cn } from "@/lib/utils";

function safeAmount(value: any): string {
  if (value === null || value === undefined) return "0.00";
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RecentOrders({ limit = 5 }: { limit?: number } = {}) {
  const { data, isLoading } = useRecentOrders(limit);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const orders = Array.isArray(data) ? data : ((data as any)?.data ?? []);

  const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PENDING: { label: "In attesa", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    CONFIRMED: { label: "Confermato", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    PROCESSING: { label: "In lavorazione", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
    SHIPPED: { label: "Spedito", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
    DELIVERED: { label: "Consegnato", bg: "bg-teal-50 border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
    INVOICED: { label: "Fatturato", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
    PAID: { label: "Pagato", bg: "bg-slate-100 border-slate-200", text: "text-slate-700", dot: "bg-slate-500" },
    CANCELLED: { label: "Annullato", bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Ultimi Ordini Registrati</h3>
          <p className="text-xs text-slate-400">Riepilogo delle transazioni più recenti</p>
        </div>
        <Link
          href="/dashboard/orders"
          className="group inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <span>Tutti gli ordini</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {orders.map((order: any) => {
          const config = statusConfig[order.status] || {
            label: order.status || "—",
            bg: "bg-slate-50 border-slate-200",
            text: "text-slate-600",
            dot: "bg-slate-400",
          };

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 transition-all duration-150 hover:border-emerald-200 hover:bg-emerald-50/20 hover:shadow-sm cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        config.bg,
                        config.text
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{order.client?.name || "Cliente N/D"}</span>
                    {order.agent?.code && (
                      <span className="text-slate-400"> &bull; Agente {order.agent.code}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 block">
                    {safeAmount(order.totalAmount)} €
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("it-IT") : "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderId(order.id);
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  title="Visualizza Dettaglio"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-200">
            <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Nessun ordine presente</p>
            <p className="text-xs text-slate-400 mt-0.5">I nuovi ordini completati appariranno qui</p>
          </div>
        )}
      </div>

      <OrderDetailModal
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  );
}