"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useClients, useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { useAgents } from "@/hooks/use-agents";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus,
  Pencil,
  X,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Building2,
  Search,
  UserCheck,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  DOCTOR: { label: "Medico", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  CLINIC: { label: "Clinica", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  PHARMACY: { label: "Farmacia", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  HOSPITAL: { label: "Ospedale", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  DISTRIBUTOR: { label: "Distributore", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  OTHER: { label: "Altro", bg: "bg-slate-50 border-slate-200", text: "text-slate-700" },
};

function ClientsContent() {
  const searchParams = useSearchParams();
  const { data: user } = useAuth();
  const { data: clientsData, isLoading, refetch } = useClients();
  const { data: agentsData } = useAgents();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [form, setForm] = useState<any>({
    type: "PHARMACY",
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    vatNumber: "",
    agentId: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Check for ?new=1 in URL
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
    }
  }, [searchParams]);

  const isAdminOrManager = useMemo(() => {
    if (!user || !user.roles) return false;
    return user.roles.includes("ADMIN") || user.roles.includes("MANAGER");
  }, [user]);

  const clients = useMemo(
    () => (Array.isArray(clientsData) ? clientsData : ((clientsData as any)?.data ?? [])),
    [clientsData]
  );
  const agents = useMemo(
    () => (Array.isArray(agentsData) ? agentsData : ((agentsData as any)?.data ?? [])),
    [agentsData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isAdminOrManager && (!form.agentId || form.agentId === "")) {
      setError("Devi obbligatoriamente assegnare un agente a questo cliente.");
      return;
    }

    const payload = {
      ...form,
      agentId: isAdminOrManager ? form.agentId : undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      vatNumber: form.vatNumber || undefined,
    };

    try {
      if (editingId) {
        await updateClient.mutateAsync({ id: editingId, payload });
      } else {
        await createClient.mutateAsync(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({
        type: "PHARMACY",
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        vatNumber: "",
        agentId: "",
      });
      refetch();
    } catch (err: any) {
      console.error("Errore salvataggio cliente:", err);
      const message = err?.response?.data?.message || err?.message || "Errore durante il salvataggio";
      setError(message);
    }
  };

  const startEdit = (client: any) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      type: client.type,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      vatNumber: client.vatNumber || "",
      agentId: client.agentId || "",
    });
    setError(null);
    setShowForm(true);
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c: any) => {
      const matchesSearch =
        search === "" ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase()) ||
        c.vatNumber?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "ALL" || c.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [clients, search, typeFilter]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Anagrafica Clienti
          </h1>
          <p className="text-sm text-slate-500">
            Gestisci la rubrica commerciale, indirizzi, contatti e assegnazioni agenti
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setError(null);
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95"
        >
          <Plus size={18} /> AGGIUNGI CLIENTE
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Modifica Scheda Cliente" : "Nuova Anagrafica Cliente"}
                </h2>
                <p className="text-xs text-slate-400">
                  Compila i dati societari e i recapiti per ordini e fatturazione
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
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

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Tipologia Attività *
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="DOCTOR">Medico Specialistico</option>
                <option value="CLINIC">Clinica / Centro Medico</option>
                <option value="PHARMACY">Farmacia</option>
                <option value="HOSPITAL">Presidio Ospedaliero</option>
                <option value="DISTRIBUTOR">Distributore / Grossista</option>
                <option value="OTHER">Altro / Parafarmacia</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Ragione Sociale / Nome Cliente *
              </label>
              <input
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Es. Farmacia San Marco Srl..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                placeholder="contatti@farmacia.it"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Telefono
              </label>
              <input
                type="tel"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                placeholder="+39 02 1234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Indirizzo
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Via Roma, 10"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Città
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Milano"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Partita IVA / Codice Fiscale
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                placeholder="IT12345678901"
                value={form.vatNumber}
                onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
              />
            </div>

            {isAdminOrManager ? (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Agente Assegnato di Competenza *
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  value={form.agentId}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                >
                  <option value="">-- Seleziona un Agente dalla rete vendita --</option>
                  {agents.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.code} &bull; {a.user?.lastName} {a.user?.firstName} ({a.region || "Tutte le zone"})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="md:col-span-2 rounded-xl bg-slate-50 p-3 border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Questo cliente verrà automaticamente registrato nel tuo portafoglio commerciale.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={createClient.isPending || updateClient.isPending}
              className="md:col-span-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-50"
            >
              {editingId ? "AGGIORNA DATI CLIENTE" : "SALVA CLIENTE NEL DATABASE"}
            </button>
          </form>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            placeholder="Cerca per nome, città, email o partita IVA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Tutti" },
            { id: "PHARMACY", label: "Farmacie" },
            { id: "DOCTOR", label: "Medici" },
            { id: "CLINIC", label: "Cliniche" },
            { id: "HOSPITAL", label: "Ospedali" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                typeFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200/80 bg-slate-50/80">
            <tr>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Cliente / Tipologia
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Recapiti & Sede
              </th>
              {isAdminOrManager && (
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Agente Assegnato
                </th>
              )}
              <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map((c: any) => {
              const typeCfg = TYPE_LABELS[c.type] || TYPE_LABELS.OTHER;

              return (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase",
                          typeCfg.bg,
                          typeCfg.text
                        )}
                      >
                        {typeCfg.label}
                      </span>
                      {c.vatNumber && (
                        <span className="font-mono text-[11px] text-slate-400">
                          P.IVA: {c.vatNumber}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <MapPin size={13} className="text-slate-400" />
                      <span>
                        {c.city || "Città N/D"}
                        {c.address ? `, ${c.address}` : ""}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" /> {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" /> {c.email}
                        </span>
                      )}
                    </div>
                  </td>

                  {isAdminOrManager && (
                    <td className="p-4">
                      {c.agent ? (
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                            {c.agent.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {c.agent.user?.lastName} {c.agent.user?.firstName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-rose-500 bg-rose-50 border border-rose-200 rounded-md px-2 py-0.5">
                          Non assegnato
                        </span>
                      )}
                    </td>
                  )}

                  <td className="p-4 text-center">
                    <button
                      onClick={() => startEdit(c)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      title="Modifica Anagrafica"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div className="py-16 text-center">
            <Building className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Nessun cliente trovato</p>
            <p className="text-xs text-slate-400 mt-1">
              Prova a cercare con parametri diversi o aggiungi un nuovo cliente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <ClientsContent />
    </Suspense>
  );
}