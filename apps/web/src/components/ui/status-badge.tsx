"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const config: Record<string, { label: string; className: string }> = {
  PENDING: { label: "In attesa", className: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Confermato", className: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "In lavorazione", className: "bg-purple-100 text-purple-700" },
  SHIPPED: { label: "Spedito", className: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Consegnato", className: "bg-emerald-100 text-emerald-700" },
  INVOICED: { label: "Fatturato", className: "bg-cyan-100 text-cyan-700" },
  PAID: { label: "Pagato", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Annullato", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status] || { label: status, className: "bg-gray-100 text-gray-700" };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", c.className)}>
      {c.label}
    </span>
  );
}
