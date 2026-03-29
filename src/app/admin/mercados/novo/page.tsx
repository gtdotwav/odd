"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { slugify } from "@/lib/utils";

const CATEGORIES = ["Economia", "Futebol", "Politica", "Cultura Pop", "Cripto", "Esportes", "Mundo", "Tech / IA"];
const TYPES = [
  { value: "binary", label: "Binario (Sim/Nao)" },
  { value: "multiple", label: "Multipla escolha" },
];
const STATUSES = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
];

export default function AdminNovoMercado() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState("binary");
  const [resolutionDate, setResolutionDate] = useState("");
  const [context, setContext] = useState("");
  const [rules, setRules] = useState("");
  const [source, setSource] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState("draft");

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || undefined,
          category,
          type,
          resolution_date: resolutionDate || undefined,
          context: context || undefined,
          rules: rules || undefined,
          source: source || undefined,
          featured,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Erro ao criar mercado");
      }

      router.push("/admin/mercados");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/mercados"
          className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-text">Novo Mercado</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-down/10 border border-down/20 text-sm text-down flex items-center gap-2">
          <Icon name="alert-triangle" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Titulo */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Titulo *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Ex: O Ibovespa vai fechar acima de 130K em junho?"
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text-secondary font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <p className="text-xs text-text-tertiary mt-1">Gerado automaticamente a partir do titulo</p>
        </div>

        {/* Subtitulo */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Subtitulo</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Descricao curta do mercado"
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Categoria + Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Categoria *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data de resolucao */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Data de resolucao</label>
          <input
            type="date"
            value={resolutionDate}
            onChange={(e) => setResolutionDate(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Contexto */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Contexto</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            placeholder="Contexto e informacoes relevantes sobre o mercado..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
          />
        </div>

        {/* Regras */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Regras de resolucao</label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            rows={3}
            placeholder="Criterios para resolver este mercado como Sim ou Nao..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
          />
        </div>

        {/* Fonte */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Fonte</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="URL ou nome da fonte de resolucao"
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Status + Destaque */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2.5 h-10 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={featured}
                onClick={() => setFeatured(!featured)}
                className={`relative w-10 h-5.5 rounded-full transition-colors ${
                  featured ? "bg-accent" : "bg-border-strong"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                    featured ? "translate-x-[18px]" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-text">Destaque</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <button
            type="submit"
            disabled={submitting || !title}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Criando...
              </>
            ) : (
              <>
                <Icon name="plus" className="w-4 h-4" />
                Criar Mercado
              </>
            )}
          </button>
          <Link
            href="/admin/mercados"
            className="h-10 px-5 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-surface-raised inline-flex items-center transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
