'use client';

import { useState } from 'react';

interface Commission {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  amount: number | string;
  percentage: number | string;
  agent: {
    code: string;
    user: { firstName: string; lastName: string };
  };
  order: {
    orderNumber: string;
  };
}

interface CommissionActionsProps {
  commission: Commission;
  onStatusChange: (id: string, newStatus: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'In attesa',  color: 'bg-yellow-100 text-yellow-800' },
  APPROVED:  { label: 'Approvata',  color: 'bg-green-100 text-green-800' },
  PAID:      { label: 'Pagata',     color: 'bg-blue-100 text-blue-800' },
  CANCELLED: { label: 'Annullata',  color: 'bg-red-100 text-red-800' },
};

export function CommissionStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function CommissionActions({ commission, onStatusChange }: CommissionActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = async (endpoint: string, body?: object) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commissions/${commission.id}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Errore HTTP ${res.status}`);
      }

      const updated = await res.json();
      // ✅ Notify parent with new status
      onStatusChange(commission.id, updated.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="flex items-center gap-2">
        <CommissionStatusBadge status={commission.status} />

        {/* ✅ FIX: Approve button — calls PATCH /commissions/:id/approve → APPROVED */}
        {commission.status === 'PENDING' && (
          <button
            onClick={() => callApi('approve')}
            disabled={loading}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '...' : '✓ Approva'}
          </button>
        )}

        {/* Mark as PAID — only after APPROVED */}
        {commission.status === 'APPROVED' && (
          <button
            onClick={() => callApi('pay')}
            disabled={loading}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '...' : '€ Segna pagata'}
          </button>
        )}

        {/* Cancel — available for PENDING and APPROVED */}
        {(commission.status === 'PENDING' || commission.status === 'APPROVED') && (
          <button
            onClick={() => {
              if (confirm('Annullare questa commissione?')) {
                callApi('cancel', { reason: 'Annullata manualmente dall\'amministratore' });
              }
            }}
            disabled={loading}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
          >
            {loading ? '...' : '✕ Annulla'}
          </button>
        )}
      </div>
    </div>
  );
}
