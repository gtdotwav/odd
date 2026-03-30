"use client";

import Link from "next/link";
import Image from "next/image";
import Icon from "./Icon";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

const mobileCategories = [
  { href: "/explorar?cat=futebol", label: "Futebol", icon: "football" },
  { href: "/explorar?cat=politica", label: "Política", icon: "building" },
  { href: "/explorar?cat=economia", label: "Economia", icon: "trend-up" },
  { href: "/explorar?cat=cultura", label: "Cultura Pop", icon: "film" },
  { href: "/explorar?cat=cripto", label: "Cripto", icon: "bitcoin" },
];

const navLinks = [
  { href: "/explorar", label: "Explorar" },
  { href: "/agora", label: "Agora", live: true },
  { href: "/diarias", label: "Diárias" },
  { href: "/docs", label: "API" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isSignedIn: clerkSignedIn, user } = useUser();
  const clerk = useClerk();
  const isSignedIn = !!clerkSignedIn;
  const signOut = () => clerk.signOut();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="Odd" width={240} height={90} className="h-20 w-auto" priority />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  link.live ? "flex items-center gap-1.5" : ""
                } ${
                  isActive
                    ? "text-text font-medium bg-surface-raised"
                    : "text-text-secondary hover:text-text hover:bg-surface-raised"
                }`}
              >
                {link.live && <span className="w-1.5 h-1.5 rounded-full bg-down animate-pulse-live" />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <button type="button" className="hidden md:flex flex-1 max-w-md items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface text-sm text-text-tertiary hover:border-border-strong transition-colors mx-4">
          <Icon name="search" className="w-4 h-4 opacity-50" />
          Buscar mercados, pessoas, categorias...
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-border font-mono">⌘K</kbd>
        </button>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile search */}
          <button type="button" aria-label="Buscar" className="md:hidden p-2 text-text-secondary hover:text-text">
            <Icon name="search" className="w-5 h-5" />
          </button>

          {isSignedIn && user ? (
            <>
              <Link href="/notificacoes" aria-label="Notificações" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-text-secondary hover:text-text rounded-md hover:bg-surface-raised transition-colors">
                <Icon name="bell" className="w-4 h-4" />
              </Link>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-raised transition-colors"
                >
                  {user.imageUrl ? (
                    <Image src={user.imageUrl} alt={user.fullName || ""} width={32} height={32} className="rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                      {user.firstName?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium text-text max-w-[100px] truncate">
                    {user.firstName || "Usuário"}
                  </span>
                  <Icon name="chevron-down" className="w-3.5 h-3.5 text-text-tertiary hidden md:block" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-surface shadow-xl z-50 py-1">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-text truncate">{user.fullName || user.firstName}</p>
                      <p className="text-xs text-text-tertiary truncate">{user.primaryEmailAddress?.emailAddress}</p>
                    </div>
                    <Link href="/portfolio" className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-raised transition-colors" onClick={() => setDropdownOpen(false)}>
                      <Icon name="bar-chart" className="w-4 h-4 opacity-60" />
                      Portfolio
                    </Link>
                    <Link href="/carteira" className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-raised transition-colors" onClick={() => setDropdownOpen(false)}>
                      <Icon name="gift" className="w-4 h-4 opacity-60" />
                      Carteira
                    </Link>
                    <Link href="/watchlist" className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-raised transition-colors" onClick={() => setDropdownOpen(false)}>
                      <Icon name="star" className="w-4 h-4 opacity-60" />
                      Watchlist
                    </Link>
                    <Link href="/config" className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-raised transition-colors" onClick={() => setDropdownOpen(false)}>
                      <Icon name="settings" className="w-4 h-4 opacity-60" />
                      Configurações
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      type="button"
                      onClick={() => { setDropdownOpen(false); signOut?.(); }}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-down hover:bg-surface-raised transition-colors w-full text-left"
                    >
                      <Icon name="share" className="w-4 h-4 opacity-60" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button type="button" aria-label="Notificações" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono text-text-secondary hover:text-text rounded-md hover:bg-surface-raised transition-colors">
                <Icon name="bell" className="w-4 h-4" />
                <span className="w-4 h-4 rounded-full bg-highlight text-[10px] text-white flex items-center justify-center font-sans">3</span>
              </button>
              <Link
                href="/auth/login"
                className="hidden md:block text-sm font-medium text-text-secondary hover:text-text transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/auth/cadastro"
                className="px-4 py-1.5 rounded-md bg-highlight hover:bg-highlight-hover text-white text-sm font-semibold transition-colors"
              >
                Começar
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <button type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} className="md:hidden p-2 text-text-secondary" onClick={() => setMenuOpen(!menuOpen)}>
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
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 text-sm rounded-md ${
                    isActive ? "text-text font-medium bg-surface-raised" : "text-text-secondary hover:text-text hover:bg-surface-raised"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
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
            {isSignedIn && (
              <>
                <div className="h-px bg-border my-2" />
                <Link href="/portfolio" className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised" onClick={() => setMenuOpen(false)}>
                  <Icon name="bar-chart" className="w-4 h-4 opacity-50" />
                  Portfolio
                </Link>
                <Link href="/carteira" className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text rounded-md hover:bg-surface-raised" onClick={() => setMenuOpen(false)}>
                  <Icon name="gift" className="w-4 h-4 opacity-50" />
                  Carteira
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
