"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icon";

const navSections = [
  {
    label: "Visao Geral",
    items: [
      { href: "/tenant", icon: "home", label: "Dashboard" },
      { href: "/tenant/analytics", icon: "trend-up", label: "Analytics" },
    ],
  },
  {
    label: "Gestao",
    items: [
      { href: "/tenant/mercados", icon: "bar-chart", label: "Mercados" },
      { href: "/tenant/usuarios", icon: "users", label: "Usuarios" },
      { href: "/tenant/financeiro", icon: "wallet", label: "Financeiro" },
    ],
  },
  {
    label: "Captacao",
    items: [
      { href: "/tenant/campanhas", icon: "zap", label: "Campanhas" },
      { href: "/tenant/config", icon: "settings", label: "Configuracoes" },
    ],
  },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const isLoginPage = pathname === "/tenant/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    fetch("/api/tenant/auth")
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          router.replace("/tenant/login");
        }
      })
      .catch(() => {
        router.replace("/tenant/login");
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-highlight/30 border-t-highlight rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  function isActive(href: string) {
    if (href === "/tenant") return pathname === "/tenant";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch("/api/tenant/auth", { method: "DELETE" });
    router.replace("/tenant/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/tenant" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-highlight flex items-center justify-center">
            <Icon name="bar-chart" className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">Odd Tenant</span>
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

      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Icon name="shield" className="w-[18px] h-[18px]" />
          Painel Admin
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Icon name="external-link" className="w-[18px] h-[18px]" />
          Voltar ao site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-down hover:bg-down/10 transition-colors"
        >
          <Icon name="log-out" className="w-[18px] h-[18px]" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#1e293b]">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      <div className="flex-1 lg:pl-64">
        <div className="sticky top-0 z-30 flex items-center h-14 px-4 bg-[#0f172a] border-b border-white/10 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 text-sm font-semibold text-white">Odd Tenant</span>
        </div>

        <main className="p-4 md:p-6 lg:p-8 text-white">{children}</main>
      </div>
    </div>
  );
}
