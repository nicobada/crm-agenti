'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

export interface CommissionFilters {
  status: string;
  from: string;
  to: string;
  search: string;
}

interface CommissionFiltersProps {
  filters: CommissionFilters;
  onChange: (filters: CommissionFilters) => void;
}

export function CommissionFiltersPanel({ filters, onChange }: CommissionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = filters.status || filters.from || filters.to;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtri
          {hasActiveFilters && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
              Attivi
            </span>
          )}
        </div>
        {isOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Ricerca</label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => onChange({ ...filters, search: e.target.value })}
                placeholder="Cerca cliente o agente..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Stato</label>
              <select
                value={filters.status}
                onChange={(e) => onChange({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Tutti</option>
                <option value="PENDING">In attesa</option>
                <option value="APPROVED">Approvate</option>
                <option value="PAID">Pagate</option>
                <option value="CANCELLED">Annullate</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Dal</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => onChange({ ...filters, from: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Al</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => onChange({ ...filters, to: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => onChange({ status: '', from: '', to: '', search: '' })}
              className="mt-3 text-xs text-slate-500 hover:text-slate-700"
            >
              Resetta filtri
            </button>
          )}
        </div>
      )}
    </div>
  );
}
