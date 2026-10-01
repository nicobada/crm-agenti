"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Package,
  Plus,
  Edit3,
  Search,
  X,
  Loader2,
  Save,
  Ban,
  Boxes,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useAuthWithFlags } from "@/hooks/use-auth";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const { isAdminOrManager, isLoading: authLoading } = useAuthWithFlags();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedProduct) return api.patch(`/products/${selectedProduct.id}`, data);
      return api.post("/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
      setSelectedProduct(null);
    },
  });

  const outOfStockMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/products/${id}`, { stock: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      basePrice: Number(formData.get("basePrice")),
      stock: Number(formData.get("stock")),
    };
    mutation.mutate(payload);
  };

  const filtered = useMemo(() => {
    return (
      products?.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toLowerCase())
      ) || []
    );
  }, [products, search]);

  if (isLoading || authLoading) {
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
            Catalogo Prodotti & Listino
          </h1>
          <p className="text-sm text-slate-500">
            Gestisci i prezzi base, codici SKU e la disponibilità delle scorte a magazzino
          </p>
        </div>
        {isAdminOrManager && (
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95"
          >
            <Plus size={18} /> NUOVO PRODOTTO
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            placeholder="Cerca per codice SKU o nome prodotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs font-semibold text-slate-400">
          {filtered.length} articoli trovati
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200/80 bg-slate-50/80">
            <tr>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Codice SKU
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Nome Prodotto
              </th>
              <th className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Prezzo Base
              </th>
              <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Disponibilità Magazzino
              </th>
              {isAdminOrManager && (
                <th className="p-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                  Azioni
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p: any) => {
              const stock = p.stock ?? 0;
              let stockBadge = {
                label: `Disponibile (${stock} pz)`,
                bg: "bg-emerald-50 border-emerald-200",
                text: "text-emerald-700",
                dot: "bg-emerald-500",
              };

              if (stock === 0) {
                stockBadge = {
                  label: "Esaurito (0 pz)",
                  bg: "bg-rose-50 border-rose-200",
                  text: "text-rose-700",
                  dot: "bg-rose-500",
                };
              } else if (stock <= 10) {
                stockBadge = {
                  label: `Scorte Basse (${stock} pz)`,
                  bg: "bg-amber-50 border-amber-200",
                  text: "text-amber-700",
                  dot: "bg-amber-500",
                };
              }

              return (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-slate-500">{p.sku}</td>
                  <td className="p-4 font-bold text-slate-900 text-sm">{p.name}</td>
                  <td className="p-4 text-right font-black text-emerald-600 text-sm">
                    {Number(p.basePrice).toLocaleString("it-IT", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
                        stockBadge.bg,
                        stockBadge.text
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", stockBadge.dot)} />
                      {stockBadge.label}
                    </span>
                  </td>
                  {isAdminOrManager && (
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (confirm(`Sei sicuro di voler azzerare lo stock di "${p.name}"?`)) {
                              outOfStockMutation.mutate(p.id);
                            }
                          }}
                          disabled={p.stock === 0 || outOfStockMutation.isPending}
                          title="Imposta fuori stock (0 pz)"
                          className="inline-flex items-center gap-1 rounded-xl bg-orange-50 border border-orange-200 px-2.5 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Ban size={13} />
                          <span className="hidden sm:inline">Fuori Stock</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsModalOpen(true);
                          }}
                          className="rounded-xl p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          title="Modifica prodotto"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Boxes className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Nessun prodotto trovato</p>
            <p className="text-xs text-slate-400 mt-1">
              Verifica i termini di ricerca o registra un nuovo articolo.
            </p>
          </div>
        )}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedProduct ? "Modifica Scheda Prodotto" : "Nuovo Articolo a Catalogo"}
                  </h2>
                  <p className="text-xs text-slate-400">Inserisci codice SKU, nome e giacenza</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Nome Prodotto *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={selectedProduct?.name}
                  placeholder="Es. Dispositivo Diagnostico X100"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Codice SKU *
                </label>
                <input
                  name="sku"
                  required
                  defaultValue={selectedProduct?.sku}
                  placeholder="Es. SKU-MED-001"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 font-mono text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Prezzo Base (€) *
                  </label>
                  <input
                    name="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={selectedProduct?.basePrice}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Stock Magazzino *
                  </label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    required
                    defaultValue={selectedProduct?.stock}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                disabled={mutation.isPending}
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {mutation.isPending ? "Salvataggio..." : "SALVA PRODOTTO"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}