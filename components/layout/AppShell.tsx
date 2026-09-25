"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  ListChecks,
  Users,
  Calendar,
  Wallet,
  BarChart3,
  CheckSquare,
  Settings,
  Menu,
  X,
  Plus,
  LogOut,
  Heart,
  CreditCard,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/parcelas", label: "Parcelas", icon: ListChecks },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/fornecedores", label: "Fornecedores", icon: Users },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/orcamento", label: "Orçamento", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/checklist", label: "Checklist", icon: CheckSquare },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const MOBILE_ITEMS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/despesas", label: "Despesas", icon: Receipt },
  { href: "/parcelas", label: "Parcelas", icon: ListChecks },
  { href: "/fornecedores", label: "Fornec.", icon: Users },
];

export default function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-surface shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-full bg-champagne/40 flex items-center justify-center">
            <Heart className="w-4.5 h-4.5 text-accent" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Controle Financeiro</p>
            <p className="text-xs text-muted leading-tight">de Casamento</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-champagne/30 text-accent-dark"
                    : "text-foreground/80 hover:bg-champagne/15"
                )}
              >
                <item.icon className="w-4.5 h-4.5" strokeWidth={1.6} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <p className="px-3 text-xs text-muted mb-2 truncate">{userName}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-champagne/15"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-surface border-b border-border flex items-center justify-between px-4 h-14">
        <button onClick={() => setSidebarOpen(true)} aria-label="Menu">
          <Menu className="w-6 h-6" />
        </button>
        <p className="font-serif-heading text-base font-semibold">Casamento</p>
        <Link href="/busca" aria-label="Buscar">
          <Search className="w-5 h-5" />
        </Link>
      </div>

      {/* Mobile slide-out sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-surface h-full flex flex-col z-50">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <p className="font-semibold">Menu</p>
              <button onClick={() => setSidebarOpen(false)} aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium",
                    pathname.startsWith(item.href) ? "bg-champagne/30 text-accent-dark" : "text-foreground/80"
                  )}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.6} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-danger mt-2"
              >
                <LogOut className="w-5 h-5" /> Sair
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pt-14 md:pt-0 pb-24 md:pb-0 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border flex items-stretch h-16">
        {MOBILE_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px]",
                active ? "text-accent-dark" : "text-muted"
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.7} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] text-muted"
        >
          <Menu className="w-5 h-5" strokeWidth={1.7} />
          Mais
        </button>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-surface w-full rounded-t-2xl p-4 z-50 grid grid-cols-3 gap-3">
            {NAV_ITEMS.filter((i) => !MOBILE_ITEMS.find((m) => m.href === i.href)).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-lg hover:bg-champagne/15 text-xs"
              >
                <item.icon className="w-5 h-5" strokeWidth={1.6} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Floating action button */}
      <div className="md:hidden fixed right-4 bottom-20 z-30">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 bg-surface border border-border rounded-xl shadow-lg overflow-hidden w-52">
            {[
              { label: "Nova despesa", href: "/despesas?novo=1" },
              { label: "Novo fornecedor", href: "/fornecedores?novo=1" },
              { label: "Registrar pagamento", href: "/parcelas" },
              { label: "Nova tarefa", href: "/checklist?novo=1" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => setFabOpen(false)}
                className="block px-4 py-3 text-sm border-b last:border-b-0 border-border hover:bg-champagne/10"
              >
                {a.label}
              </Link>
            ))}
          </div>
        )}
        <button
          onClick={() => setFabOpen((v) => !v)}
          aria-label="Ações rápidas"
          className={cn(
            "w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center transition-transform",
            fabOpen && "rotate-45"
          )}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
