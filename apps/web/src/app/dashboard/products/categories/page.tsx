"use client";

import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-categories';
import { ArrowLeft, Save, Plus, Trash2, Edit3, Folder, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // State for form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      slug: slug.trim() || undefined,
      parentId: parentId || null,
      description: description.trim() || null,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
        alert("Categoria aggiornata con successo!");
      } else {
        await createMutation.mutateAsync(payload);
        alert("Categoria creata con successo!");
      }
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.message || "Errore durante il salvataggio");
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug || '');
    setParentId(category.parentId || '');
    setDescription(category.description || '');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questa categoria?")) {
      try {
        await deleteMutation.mutateAsync(id);
        alert("Categoria eliminata con successo!");
        if (editingId === id) resetForm();
      } catch (err: any) {
        alert(err.response?.data?.message || "Errore durante l'eliminazione");
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setParentId('');
    setDescription('');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
          <Link href="/dashboard/products" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2 transition-colors">
            <ArrowLeft size={12} /> Torna al Catalogo
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Folder className="text-emerald-600"/> Categorie Prodotti
          </h1>
          <p className="text-slate-500">Organizza il tuo catalogo in categorie gerarchiche</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto items-start">
        {/* Form di creazione/modifica */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 text-base">
            {editingId ? "Modifica Categoria" : "Aggiungi Nuova Categoria"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="es. Elettronica"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Slug (opzionale)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2.5 border rounded-lg outline-none font-mono focus:ring-2 focus:ring-emerald-500/20 text-xs"
                placeholder="es. elettronica"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria Genitore</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full p-2.5 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Nessuna (Categoria principale)</option>
                {categories?.filter((c: any) => c.id !== editingId).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrizione</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Descrizione della categoria..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : editingId ? (
                  <>
                    <Save size={16} /> Salva
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Aggiungi
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-colors"
                >
                  Annulla
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabella elenco categorie */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden md:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap text-xs">
              <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Genitore</th>
                  <th className="p-4">Descrizione</th>
                  <th className="p-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories?.map((c: any) => {
                  const parentCat = categories.find((parent: any) => parent.id === c.parentId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">{c.name}</td>
                      <td className="p-4 font-mono text-slate-500 text-[11px]">{c.slug}</td>
                      <td className="p-4 text-slate-600">
                        {parentCat ? (
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-semibold">
                            {parentCat.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{c.description || <span className="text-slate-300">—</span>}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Modifica"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Elimina"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!categories || categories.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Nessuna categoria configurata. Creane una usando il modulo a sinistra.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
