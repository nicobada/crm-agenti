'use client';

import { TrendingUp, Clock, CheckCircle, Euro } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SummaryData {
  totalAmount: number;
  totalCount: number;
  pendingAmount: number;
  pendingCount: number;
  paidAmount: number;
  paidCount: number;
}

export function SummaryCards({ data }: { data?: SummaryData }) {
  const cards = [
    {
      title: 'Totale Provvigioni',
      value: formatCurrency(data?.totalAmount || 0),
      count: data?.totalCount || 0,
      icon: Euro,
      color: 'bg-blue-500',
    },
    {
      title: 'In Attesa',
      value: formatCurrency(data?.pendingAmount || 0),
      count: data?.pendingCount || 0,
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      title: 'Pagate',
      value: formatCurrency(data?.paidAmount || 0),
      count: data?.paidCount || 0,
      icon: CheckCircle,
      color: 'bg-emerald-500',
    },
    {
      title: 'Media per Ordine',
      value: formatCurrency(
        data && data.totalCount > 0 ? data.totalAmount / data.totalCount : 0,
      ),
      count: 0,
      icon: TrendingUp,
      color: 'bg-violet-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
              {card.count > 0 && (
                <p className="mt-1 text-xs text-slate-400">{card.count} commissioni</p>
              )}
            </div>
            <div className={`rounded-lg ${card.color} p-3`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
