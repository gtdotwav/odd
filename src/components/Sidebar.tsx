"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

interface SidebarItem {
  href: string;
  label: string;
  icon: string;
}

const sections: { title: string; items: SidebarItem[] }[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Início", icon: "home" },
      { href: "/explorar", label: "Explorar", icon: "search" },
      { href: "/agora", label: "Agora", icon: "zap" },
    ],
  },
  {
    title: "Categorias",
    items: [
      { href: "/explorar?cat=futebol", label: "Futebol BR", icon: "football" },
      { href: "/explorar?cat=politica", label: "Política", icon: "building" },
      { href: "/explorar?cat=economia", label: "Economia", icon: "trend-up" },
      { href: "/explorar?cat=cultura", label: "Cultura Pop", icon: "film" },
      { href: "/explorar?cat=cripto", label: "Cripto", icon: "bitcoin" },
      { href: "/explorar?cat=esportes", label: "Esportes", icon: "trophy" },
      { href: "/explorar?cat=mundo", label: "Mundo", icon: "globe" },
      { href: "/explorar?cat=tech", label: "Tech / IA", icon: "cpu" },
      { href: "/explorar?cat=clima", label: "Clima", icon: "cloud" },
      { href: "/explorar?cat=ciencia", label: "Ciencia", icon: "beaker" },
      { href: "/explorar?cat=saude", label: "Saude", icon: "heart" },
      { href: "/explorar?cat=entretenimento", label: "Entretenimento", icon: "tv" },
    ],
  },
  {
    title: "Pessoal",
    items: [
      { href: "/portfolio", label: "Portfolio", icon: "bar-chart" },
      { href: "/carteira", label: "Carteira", icon: "gift" },
      { href: "/watchlist", label: "Watchlist", icon: "star" },
    ],
  },
  {
    title: "Comunidade",
    items: [
      { href: "/rankings", label: "Rankings", icon: "trophy" },
      { href: "/confianca", label: "Confiança", icon: "shield" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin", label: "Painel Admin", icon: "lock" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const fullPath = typeof window !== "undefined" ? pathname + window.location.search : pathname;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href.includes("?")) return fullPath === href || fullPath.startsWith(href + "&");
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden lg:block w-60 shrink-0 border-r border-border overflow-y-auto h-[calc(100vh-80px)] sticky top-20 py-3 px-2">
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          <h4 className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
            {section.title}
          </h4>
          {section.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive(item.href)
                    ? "text-text font-medium bg-surface-raised"
                    : "text-text-secondary hover:text-text hover:bg-surface-raised"
                }`}
              >
                <Icon name={item.icon} className={`w-4 h-4 shrink-0 ${isActive(item.href) ? "opacity-100" : "opacity-60"}`} />
                {item.label}
              </Link>
            ))}
        </div>
      ))}
    </aside>
  );
}
