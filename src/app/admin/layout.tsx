"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

const navSections = [
  {
    label: "Geral",
    items: [
      { href: "/admin", icon: "home", label: "Dashboard" },
      { href: "/admin/mercados", icon: "bar-chart", label: "Mercados" },
      { href: "/admin/usuarios", icon: "users", label: "Usuarios" },
    ],
  },
  {
    label: "Operacoes",
    items: [
      { href: "/admin/ordens", icon: "zap", label: "Ordens" },
      { href: "/admin/financeiro", icon: "wallet", label: "Financeiro" },
      { href: "/admin/comentarios", icon: "inbox", label: "Comentarios" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Icon name="shield" className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">Odd Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "text-white bg-white/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon name={item.icon} className="w-[18px] h-[18px]" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Icon name="external-link" className="w-[18px] h-[18px]" />
          Voltar ao site
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#1a1a2e]">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a2e] transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center h-14 px-4 bg-surface border-b border-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <svg className="w-5 h-5 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 text-sm font-semibold text-text">Odd Admin</span>
        </div>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
