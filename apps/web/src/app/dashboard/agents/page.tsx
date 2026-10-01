"use client";

import { useState, useMemo } from "react";
import { useAgents, useCreateAgent, useUpdateAgent, useToggleAgentStatus } from "@/hooks/use-agents";
import {
  Plus,
  Pencil,
  X,
  ShieldCheck,
  ShieldAlert,
  Percent,
  MapPin,
  Mail,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AREA_OPTIONS = ["Nord", "Nord-ovest", "Centro", "Centro-sud", "Sud", "Isole"];

export default function AgentsPage() {
  const { data: agentsData, isLoading, refetch } = useAgents();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const toggleStatus = useToggleAgentStatus();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    code: "",
    region: "",
    commissionRate: 10,
  });
  const [error, setError] = useState<string | null>(null);

  const agents = useMemo(
    () => (Array.isArray(agentsData) ? agentsData : agentsData?.data || []),
    [agentsData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        ...form,
        commissionRate: Number(form.commissionRate),
      };

      if (editingId) {
        const updatePayload = { ...payload };
        if (!updatePayload.password) delete updatePayload.password;
        await updateAgent.mutateAsync({ id: editingId, payload: updatePayload });
      } else {
        if (!payload.code || payload.code === "") delete payload.code;
        await createAgent.mutateAsync(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        code: "",
        region: "",
        commissionRate: 10,
      });
      refetch();
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || "Errore durante il salvataggio";
      setError(Array.isArray(message) ? message.join(", ") : message);
    }
  };

  const startEdit = (agent: any) => {
    setEditingId(agent.id);
    setForm({
      firstName: agent.user?.firstName,
      lastName: agent.user?.lastName,
      email: agent.user?.email,
      code: agent.code.replace("AGT-", ""),
      region: agent.region || "",
      commissionRate: agent.commissionRate,
      password: "",
    });
    setError(null);
    setShowForm(true);
  };

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
            Rete Agenti & Commerciali
          </h1>
          <p className="text-sm text-slate-500">
            Gestisci profili venditori, aliquote provvigionali predefinite e zone operative
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
          <Plus size={18} /> AGGIUNGI AGENTE
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Modifica Profilo Agente" : "Registra Nuovo Agente"}
                </h2>
                <p className="text-xs text-slate-400">
                  Configura anagrafica utente, codice identificativo e percentuale
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
              <ShieldAlert size={18} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Nome *
              </label>
              <input
                required
                placeholder="Es. Mario"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Cognome *
              </label>
              <input
                required
                placeholder="Es. Rossi"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Codice Agente (Opzionale)
              </label>
              {editingId ? (
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 p-3 focus-within:border-emerald-500 focus-within:bg-white">
                  <span className="font-mono text-xs font-bold text-slate-400">AGT-</span>
                  <input
                    required
                    placeholder="001"
                    className="ml-1 w-full bg-transparent font-mono text-sm font-bold text-slate-900 outline-none"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-400 text-center">
                  Verrà generato automaticamente dal sistema (es. AGT-0003)
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Percentuale Provvigionale Base (%) *
              </label>
              <div className="relative">
                <input
                  required
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 pr-10 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="10.0"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                />
                <Percent
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Area Territoriale di Competenza *
              </label>
              <select
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              >
                <option value="">-- Seleziona Area / Regione --</option>
                {AREA_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {!editingId && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Email di Accesso *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="agente@crm.local"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password Iniziale *
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={createAgent.isPending || updateAgent.isPending}
              className="md:col-span-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-50"
            >
              {editingId ? "AGGIORNA PROFILO AGENTE" : "REGISTRA AGENTE NEL SISTEMA"}
            </button>
          </form>
        </div>
      )}

      {/* Agents Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200/80 bg-slate-50/80">
            <tr>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Identificativo
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Nominativo & Email
              </th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                Area Territoriale
              </th>
              <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Aliquota Base
              </th>
              <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Stato Account
              </th>
              <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agents.map((agent: any) => (
              <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-4">
                  <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-mono text-xs font-bold text-emerald-800">
                    {agent.code}
                  </span>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-900 text-sm">
                    {agent.user?.firstName} {agent.user?.lastName}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail size={12} className="text-slate-300" />
                    <span>{agent.user?.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{agent.region || "Tutte le zone"}</span>
                  </div>
                </td>
                <td className="p-4 text-center font-black text-slate-800 text-sm">
                  {agent.commissionRate}%
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={async () => {
                      await toggleStatus.mutateAsync(agent.id);
                      refetch();
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase transition-all",
                      agent.user?.isActive
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                    )}
                    title="Clicca per attivare o sospendere"
                  >
                    {agent.user?.isActive ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                    {agent.user?.isActive ? "Attivo" : "Sospeso"}
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => startEdit(agent)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    title="Modifica Agente"
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {agents.length === 0 && (
          <div className="py-16 text-center">
            <Users className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Nessun agente registrato</p>
            <p className="text-xs text-slate-400 mt-1">
              Aggiungi il primo agente commerciale per avviare la rete vendita.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}