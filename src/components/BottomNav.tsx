"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const items = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/explorar", label: "Explorar", icon: "compass" },
  { href: "/agora", label: "Agora", icon: "zap" },
  { href: "/docs", label: "API", icon: "cpu" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-lg"
    >
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors ${
                isActive ? "text-accent" : "text-text-tertiary"
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
