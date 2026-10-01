"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useOrders, useCreateOrder } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus,
  Trash2,
  ShoppingCart,
  X,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";
import { OrderDetailModal } from "@/components/orders/order-detail-modal";
import { cn } from "@/lib/utils";

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

function OrdersContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const { data: ordersData, isLoading, refetch } = useOrders();
  const { data: clientsData } = useClients();
  const { data: productsData } = useProducts();
  const createOrder = useCreateOrder();

  const [showForm, setShowForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState<any>({
    clientId: "",
    notes: "",
    status: "CONFIRMED", // Di default confermato per scalare stock e procedere
    items: [{ productId: "", quantity: 1, unitPrice: 0, productName: "", discount: 0 }],
  });

  // Apri il form automaticamente se la query string ha ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
    }
  }, [searchParams]);

  const orders = useMemo(
    () => (Array.isArray(ordersData) ? ordersData : (ordersData as any)?.data || []),
    [ordersData]
  );
  const clients = useMemo(
    () => (Array.isArray(clientsData) ? clientsData : (clientsData as any)?.data || []),
    [clientsData]
  );
  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : (productsData as any)?.data || []),
    [productsData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanClientId = form.clientId && form.clientId !== "" ? form.clientId : undefined;

    if (!cleanClientId) {
      setError("Devi selezionare un cliente.");
      return;
    }

    const payload = {
      clientId: cleanClientId,
      notes: form.notes?.trim() || undefined,
      status: form.status || "CONFIRMED",
      items: form.items.map((i: any) => ({
        productId: i.productId && i.productId !== "" ? i.productId : undefined,
        productName: i.productName?.trim(),
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
        discount: Number(i.discount) || 0,
      })),
    };

    if (payload.items.some((i: any) => !i.productName || i.productName === "")) {
      setError("Ogni riga ordine deve avere un prodotto valido.");
      return;
    }

    try {
      await createOrder.mutateAsync(payload);
      setShowForm(false);
      setForm({
        clientId: "",
        notes: "",
        status: "CONFIRMED",
        items: [{ productId: "", quantity: 1, unitPrice: 0, productName: "", discount: 0 }],
      });
      refetch();
    } catch (err: any) {
      console.error("Dettaglio errore:", err.response?.data || err);
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Errore durante il salvataggio.");
    }
  };

  const calculateTotal = () => {
    return form.items.reduce((acc: number, item: any) => {
      const price = Number(item.unitPrice || 0) * Number(item.quantity || 0);
      const discount = (price * Number(item.discount || 0)) / 100;
      return acc + (price - discount);
    }, 0);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesSearch =
        search === "" ||
        order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        order.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
        order.agent?.user?.lastName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gestione Ordini
          </h1>
          <p className="text-sm text-slate-500">
            Monitora le vendite, lo stato di evasione e le provvigioni maturate
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setError(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95"
        >
          <Plus size={18} /> NUOVO ORDINE
        </button>
      </div>

      {/* Form Modal / Panel */}
      {showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registra Nuovo Ordine</h2>
                <p className="text-xs text-slate-400">Inserisci i dettagli e gli articoli richiesti</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              <AlertCircle size={18} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Cliente Assegnatario *
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                >
                  <option value="">-- Seleziona cliente dal portafoglio --</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.city ? `(${c.city})` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  L'agente assegnato a questo cliente riceverà automaticamente la provvigione.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Stato Iniziale Ordine
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="CONFIRMED">Confermato (Scala subito lo stock dal magazzino)</option>
                  <option value="PENDING">In Attesa (Non scala ancora lo stock)</option>
                </select>
              </div>
            </div>

            {/* Prodotti */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Articoli dell'Ordine
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      items: [
                        ...form.items,
                        { productId: "", quantity: 1, unitPrice: 0, productName: "", discount: 0 },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <Plus size={14} /> Aggiungi Riga
                </button>
              </div>

              {form.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 items-end rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors"
                >
                  <div className="col-span-12 md:col-span-5">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Prodotto da Listino
                    </label>
                    <select
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                      value={item.productId}
                      onChange={(e) => {
                        const p = products.find((x: any) => x.id === e.target.value);
                        const newItems = [...form.items];
                        newItems[idx] = {
                          ...newItems[idx],
                          productId: p?.id || "",
                          productName: p?.name || "",
                          unitPrice: p?.basePrice || 0,
                        };
                        setForm({ ...form, items: newItems });
                      }}
                    >
                      <option value="">-- Seleziona prodotto --</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock ?? 0} pz &bull; € {Number(p.basePrice).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Quantità
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pr-8 text-center text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].quantity = e.target.value;
                          setForm({ ...form, items: newItems });
                        }}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        pz
                      </span>
                    </div>
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Prezzo Unitario
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        €
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pl-7 text-right text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].unitPrice = e.target.value;
                          setForm({ ...form, items: newItems });
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-span-3 md:col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sconto
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pr-7 text-center text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                        value={item.discount}
                        onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].discount = e.target.value;
                          setForm({ ...form, items: newItems });
                        }}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="col-span-1 text-center pb-1">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          items: form.items.filter((_: any, i: number) => i !== idx),
                        })
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-30"
                      disabled={form.items.length === 1}
                      title="Rimuovi riga"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Note Ordine */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Note di Consegna / Istruzioni Speciali
              </label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                placeholder="Eventuali note su spedizione, orari o dettagli cliente..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {/* Summary & Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Totale Complessivo Ordine
                </span>
                <span className="text-xs text-emerald-400">IVA e sconti inclusi nel calcolo</span>
              </div>
              <div className="text-3xl font-black tracking-tight text-white">
                {calculateTotal().toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrder.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-50"
            >
              {createOrder.isPending ? "Salvataggio in corso..." : "CONFERMA E REGISTRA ORDINE"}
            </button>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            placeholder="Cerca per N° Ordine, Cliente o Agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter by Status Pill Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Tutti" },
            { id: "CONFIRMED", label: "Confermati" },
            { id: "PENDING", label: "In Attesa" },
            { id: "DELIVERED", label: "Consegnati" },
            { id: "CANCELLED", label: "Annullati" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                statusFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="grid gap-3">
        {filteredOrders.map((order: any) => {
          const config = STATUS_CONFIG[order.status] || {
            label: order.status,
            bg: "bg-slate-50 border-slate-200",
            text: "text-slate-600",
            dot: "bg-slate-400",
          };

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-150 hover:border-emerald-200 hover:bg-emerald-50/20 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                        config.bg,
                        config.text
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                      {config.label}
                    </span>
                    {order.createdAt && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        &bull; {new Date(order.createdAt).toLocaleDateString("it-IT")}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {order.client?.name || "Cliente N/D"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Agente incaricato:{" "}
                    <span className="text-slate-700 font-semibold">
                      {order.agent?.user?.lastName
                        ? `${order.agent.user.firstName || ""} ${order.agent.user.lastName}`
                        : "N/D"}
                    </span>
                    {order.agent?.code && ` (${order.agent.code})`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 font-medium block">Totale Ordine</span>
                  <span className="text-xl font-black text-slate-900 block">
                    {Number(order.totalAmount).toLocaleString("it-IT", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Nessun ordine trovato</h3>
            <p className="text-xs text-slate-400 mt-1">
              Prova a cambiare i filtri di ricerca oppure registra un nuovo ordine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}