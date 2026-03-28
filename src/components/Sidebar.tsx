import Link from "next/link";
import Icon from "./Icon";

const sections = [
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
    ],
  },
  {
    title: "Pessoal",
    items: [
      { href: "/", label: "Watchlist", icon: "star" },
      { href: "/", label: "Portfolio", icon: "bar-chart" },
      { href: "/", label: "Recompensas", icon: "gift" },
    ],
  },
  {
    title: "Comunidade",
    items: [
      { href: "/", label: "Rankings", icon: "trophy" },
      { href: "/", label: "Confiança", icon: "shield" },
    ],
  },
];

export default function Sidebar() {
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
              className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised transition-colors"
            >
              <Icon name={item.icon} className="w-4 h-4 shrink-0 opacity-60" />
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
