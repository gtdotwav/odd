"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenSearch() { setOpen(true); }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-search", onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-search", onOpenSearch);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    router.push(`/explorar?search=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  }, [query, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 bg-surface rounded-xl border border-border shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Icon name="search" className="w-5 h-5 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Buscar mercados, categorias..."
            className="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-text-tertiary"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-border font-mono text-text-tertiary">
            ESC
          </kbd>
        </div>
        <div className="p-4 text-xs text-text-tertiary">
          <p>Pressione Enter para buscar em todos os mercados</p>
        </div>
      </div>
    </div>
  );
}
