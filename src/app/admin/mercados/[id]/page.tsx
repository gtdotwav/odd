"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { slugify } from "@/lib/utils";

const CATEGORIES = ["Economia", "Futebol", "Politica", "Cultura Pop", "Cripto", "Esportes", "Mundo", "Tech / IA"];
const ALL_STATUSES = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "live", label: "Ao vivo" },
  { value: "closing", label: "Fechando" },
  { value: "cancelled", label: "Cancelado" },
];

interface MarketData {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  type: string;
  status: string;
  resolution_date: string | null;
  context: string;
  rules: string;
  source: string;
  featured: boolean;
}

export default function AdminEditarMercado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState<"yes" | "no" | null>(null);
  const [showConfirm, setShowConfirm] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("binary");
  const [status, setStatus] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [context, setContext] = useState("");
  const [rules, setRules] = useState("");
  const [source, setSource] = useState("");
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch(`/api/admin/markets?search=${id}&limit=1`);
        if (!res.ok) throw new Error("Erro ao carregar mercado");
        const data = await res.json();
        const markets = data.markets || [];
        const market: MarketData | undefined = markets.find((m: MarketData) => m.id === id) || markets[0];
        if (!market) throw new Error("Mercado nao encontrado");

        setTitle(market.title || "");
        setSlug(market.slug || "");
        setSubtitle(market.subtitle || "");
        setCategory(market.category || CATEGORIES[0]);
        setType(market.type || "binary");
        setStatus(market.status || "draft");
        setResolutionDate(market.resolution_date ? market.resolution_date.split("T")[0] : "");
        setContext(market.context || "");
        setRules(market.rules || "");
        setSource(market.source || "");
        setFeatured(market.featured || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchMarket();
  }, [id]);

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(slugify(value));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/markets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || undefined,
          category,
          status,
          resolution_date: resolutionDate || undefined,
          context: context || undefined,
          rules: rules || undefined,
          source: source || undefined,
          featured,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Erro ao salvar");
      }

      setSuccess("Mercado atualizado com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(resolution: "yes" | "no") {
    setResolving(resolution);
    setShowConfirm(null);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/markets/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Erro ao resolver");
      }

      setSuccess(`Mercado resolvido como ${resolution === "yes" ? "SIM" : "NAO"}!`);
      setStatus(resolution === "yes" ? "resolved_yes" : "resolved_no");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setResolving(null);
    }
  }

  const canResolve = ["active", "live", "closing", "disputed"].includes(status);

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="space-y-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
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
        <h1 className="text-xl font-bold text-text">Editar Mercado</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-down/10 border border-down/20 text-sm text-down flex items-center gap-2">
          <Icon name="alert-triangle" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-up/10 border border-up/20 text-sm text-up flex items-center gap-2">
          <Icon name="check" className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Titulo */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Titulo *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
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
        </div>

        {/* Subtitulo */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Subtitulo</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Categoria + Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Categoria</label>
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
            <p className="h-10 flex items-center px-3 rounded-lg border border-border bg-surface-raised text-sm text-text-secondary">
              {type === "binary" ? "Binario (Sim/Nao)" : type === "multiple" ? "Multipla escolha" : type}
            </p>
          </div>
        </div>

        {/* Status + Data de resolucao */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Data de resolucao</label>
            <input
              type="date"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>

        {/* Contexto */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Contexto</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
          />
        </div>

        {/* Regras */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Regras de resolucao</label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y"
          />
        </div>

        {/* Fonte */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Fonte</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Destaque */}
        <div>
          <label className="flex items-center gap-2.5 cursor-pointer">
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

        {/* Save button */}
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <button
            type="submit"
            disabled={saving || !title}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <Icon name="check" className="w-4 h-4" />
                Salvar Alteracoes
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

      {/* Resolve section */}
      {canResolve && (
        <div id="resolver" className="mt-10 pt-6 border-t border-border">
          <h2 className="text-lg font-bold text-text mb-2">Resolver Mercado</h2>
          <p className="text-sm text-text-secondary mb-4">
            Ao resolver o mercado, todas as ordens abertas serao canceladas e os pagamentos serao distribuidos.
            Esta acao nao pode ser desfeita.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfirm("yes")}
              disabled={resolving !== null}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-up text-white text-sm font-medium hover:bg-up/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="check" className="w-4 h-4" />
              Resolver como SIM
            </button>
            <button
              onClick={() => setShowConfirm("no")}
              disabled={resolving !== null}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-down text-white text-sm font-medium hover:bg-down/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="x" className="w-4 h-4" />
              Resolver como NAO
            </button>
          </div>

          {/* Confirmation modal */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-surface rounded-xl border border-border shadow-lg max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    showConfirm === "yes" ? "bg-up/10" : "bg-down/10"
                  }`}>
                    <Icon
                      name={showConfirm === "yes" ? "check" : "x"}
                      className={`w-5 h-5 ${showConfirm === "yes" ? "text-up" : "text-down"}`}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text">Confirmar resolucao</h3>
                    <p className="text-sm text-text-secondary">
                      Resolver como {showConfirm === "yes" ? "SIM" : "NAO"}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-text-secondary mb-6">
                  Tem certeza de que deseja resolver &ldquo;{title}&rdquo; como{" "}
                  <strong className={showConfirm === "yes" ? "text-up" : "text-down"}>
                    {showConfirm === "yes" ? "SIM" : "NAO"}
                  </strong>
                  ? Esta acao nao pode ser desfeita.
                </p>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-surface-raised transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleResolve(showConfirm)}
                    disabled={resolving !== null}
                    className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      showConfirm === "yes"
                        ? "bg-up hover:bg-up/90"
                        : "bg-down hover:bg-down/90"
                    }`}
                  >
                    {resolving ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <Icon name={showConfirm === "yes" ? "check" : "x"} className="w-4 h-4" />
                    )}
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
