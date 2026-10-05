"use client";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ShieldCheck, User as UserIcon, Github } from "lucide-react";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Panoramica delle attività e metriche chiave" },
  "/dashboard/clients": { title: "Anagrafica Clienti", subtitle: "Gestione contatti, indirizzi e assegnazioni agenti" },
  "/dashboard/agents": { title: "Rete Agenti", subtitle: "Gestione profili, zone territoriali e aliquote provvigionali" },
  "/dashboard/products": { title: "Catalogo Prodotti", subtitle: "Gestione listini, prezzi e disponibilità magazzino" },
  "/dashboard/orders": { title: "Gestione Ordini", subtitle: "Ordini di vendita, stati di evasione e dettagli" },
  "/dashboard/commissions": { title: "Provvigioni", subtitle: "Report e liquidazione dei compensi maturati dagli agenti" },
  "/dashboard/upload": { title: "Carica Documenti", subtitle: "Archiviazione e associazione allegati agli ordini" },
  "/dashboard/logs": { title: "Audit Log & GDPR", subtitle: "Registro di sistema delle attività svolte dagli utenti" },
};

export function Header() {
  const { data: user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const hasRole = (r: string) => user.roles?.includes(r);

  let roleBadge = { label: "Agente", bg: "bg-emerald-50 border-emerald-200 text-emerald-700" };
  if (hasRole("ADMIN")) {
    roleBadge = { label: "Amministratore", bg: "bg-rose-50 border-rose-200 text-rose-700" };
  } else if (hasRole("MANAGER")) {
    roleBadge = { label: "Manager", bg: "bg-sky-50 border-sky-200 text-sky-700" };
  }

  const pageInfo = PAGE_TITLES[pathname] || {
    title: "CRM Agenti",
    subtitle: "Piattaforma di Gestione Commerciale",
  };

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email.split('@')[0];

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      {/* Dynamic Page Title & Subtitle */}
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
          {pageInfo.title}
        </h1>
        <p className="text-xs text-slate-400 hidden sm:block">
          {pageInfo.subtitle}
        </p>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* GitHub Developer Profile Button */}
        <a
          href="https://github.com/nicobada"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
          title="Visita il profilo GitHub dello sviluppatore @nicobada"
        >
          <Github size={13} className="text-slate-700" />
          <span>@nicobada</span>
        </a>

        {/* System Online Status */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>Online</span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-white shadow-sm shadow-emerald-600/20">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 leading-none">{displayName}</span>
              <span
                className={cn(
                  "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  roleBadge.bg
                )}
              >
                {roleBadge.label}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 leading-none truncate max-w-[150px]">
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
