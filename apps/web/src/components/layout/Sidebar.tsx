"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ShoppingCart,
  Euro,
  FileUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  UserPlus,
  PackageSearch,
  Activity,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { name: "Anagrafica Clienti", href: "/dashboard/clients", icon: Users, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { name: "Anagrafica Agenti", href: "/dashboard/agents", icon: UserCog, roles: ["ADMIN", "MANAGER"] },
  { name: "Prodotti & Listino", href: "/dashboard/products", icon: PackageSearch, roles: ["ADMIN", "MANAGER"] },
  { name: "Ordini di Vendita", href: "/dashboard/orders", icon: ShoppingCart, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { name: "Provvigioni", href: "/dashboard/commissions", icon: Euro, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { name: "Carica Documenti", href: "/dashboard/upload", icon: FileUp, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { name: "Audit Log & GDPR", href: "/dashboard/logs", icon: Activity, roles: ["ADMIN"] },
];

const quickActions = [
  { name: "Nuovo Ordine", href: "/dashboard/orders?new=1", icon: PlusCircle, roles: ["ADMIN", "MANAGER", "AGENT"] },
  { name: "Aggiungi Cliente", href: "/dashboard/clients?new=1", icon: UserPlus, roles: ["ADMIN", "MANAGER", "AGENT"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const userRoles = user.roles || [];
  const filteredNav = navigation.filter((item) =>
    item.roles.some((r) => userRoles.includes(r))
  );
  const filteredQuick = quickActions.filter((item) =>
    item.roles.some((r) => userRoles.includes(r))
  );

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-slate-200/80 bg-white shadow-[1px_0_4px_0_rgba(0,0,0,0.02)] transition-all duration-300 z-30",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-slate-900 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight leading-none text-slate-900">
                CRM Agenti
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 tracking-wider uppercase mt-0.5">
                Enterprise v1.0
              </span>
            </div>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title={collapsed ? "Espandi menu" : "Comprimi menu"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Principale
          </p>
        )}

        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                )}
              />
              {!collapsed && <span className="ml-3 truncate">{item.name}</span>}
            </Link>
          );
        })}

        {!collapsed && filteredQuick.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Azioni Rapide
            </p>
            {filteredQuick.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
              >
                <item.icon className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Enterprise & Custom Setup Card */}
      {!collapsed && (
        <div className="mx-3 mb-2 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-3 text-white shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Personalizzazioni B2B
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Vuoi integrare questo CRM con il tuo ERP o richiedere un modulo su misura?
          </p>
          <a
            href="mailto:nikybali@gmail.com?subject=Richiesta%20Personalizzazione%20CRM%20Agenti"
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600/90 hover:bg-emerald-600 px-2 py-1.5 text-[11px] font-bold text-white transition-colors"
          >
            Contatta lo Sviluppatore
          </a>
        </div>
      )}

      {/* Footer Profile & Logout */}
      <div className="border-t border-slate-200/80 p-3 bg-slate-50/50">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className={cn(
            "flex w-full items-center rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Disconnettiti" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2.5">Disconnetti</span>}
        </button>
      </div>
    </aside>
  );
}