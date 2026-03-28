"use client";

import Link from "next/link";
import Image from "next/image";
import Icon from "./Icon";
import { useState } from "react";

const mobileCategories = [
  { href: "/explorar?cat=futebol", label: "Futebol", icon: "football" },
  { href: "/explorar?cat=politica", label: "Política", icon: "building" },
  { href: "/explorar?cat=economia", label: "Economia", icon: "trend-up" },
  { href: "/explorar?cat=cultura", label: "Cultura Pop", icon: "film" },
  { href: "/explorar?cat=cripto", label: "Cripto", icon: "bitcoin" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="Odd" width={240} height={90} className="h-20 w-auto" priority />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <Link href="/explorar" className="px-3 py-1.5 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised transition-colors">
            Explorar
          </Link>
          <Link href="/agora" className="px-3 py-1.5 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-down animate-pulse-live" />
            Agora
          </Link>
          <Link href="/docs" className="px-3 py-1.5 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised transition-colors">
            API
          </Link>
        </nav>

        {/* Search */}
        <button className="hidden md:flex flex-1 max-w-md items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface text-sm text-text-tertiary hover:border-border-strong transition-colors mx-4">
          <Icon name="search" className="w-4 h-4 opacity-50" />
          Buscar mercados, pessoas, categorias...
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-border font-mono">⌘K</kbd>
        </button>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile search */}
          <button className="md:hidden p-2 text-text-secondary hover:text-text">
            <Icon name="search" className="w-5 h-5" />
          </button>

          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-text-secondary hover:text-text rounded-md hover:bg-surface-raised transition-colors">
            <Icon name="bell" className="w-4 h-4" />
            <span className="w-4 h-4 rounded-full bg-highlight text-[10px] text-white flex items-center justify-center font-sans">3</span>
          </button>

          <Link
            href="/"
            className="hidden md:block text-sm font-medium text-text-secondary hover:text-text transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/"
            className="px-4 py-1.5 rounded-md bg-highlight hover:bg-highlight-hover text-white text-sm font-semibold transition-colors"
          >
            Começar
          </Link>

          {/* Mobile menu */}
          <button className="md:hidden p-2 text-text-secondary" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-surface animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            <Link href="/explorar" className="block px-3 py-2 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised" onClick={() => setMenuOpen(false)}>
              Explorar
            </Link>
            <Link href="/agora" className="block px-3 py-2 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised" onClick={() => setMenuOpen(false)}>
              Agora
            </Link>
            <Link href="/docs" className="block px-3 py-2 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised" onClick={() => setMenuOpen(false)}>
              API
            </Link>
            <div className="h-px bg-border my-2" />
            {mobileCategories.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised"
                onClick={() => setMenuOpen(false)}
              >
                <Icon name={item.icon} className="w-4 h-4 opacity-50" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
