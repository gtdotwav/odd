"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { formatRelativeTime, cn } from "@/lib/utils";

interface Comment {
  id: string;
  user_name: string;
  user_handle: string;
  user_avatar_url: string | null;
  market_id: string;
  market_title: string;
  market_slug: string;
  body: string;
  likes: number;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AdminComentarios() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const search = searchParams.get("search") || "";
  const marketId = searchParams.get("market_id") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      if (!("page" in updates)) params.delete("page");
      router.push(`/admin/comentarios?${params.toString()}`);
    },
    [searchParams, router],
  );

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (marketId) params.set("market_id", marketId);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String((page - 1) * PAGE_SIZE));

      const res = await fetch(`/api/admin/comments?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar comentarios");
      const data = await res.json();
      setComments(data.comments || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [search, marketId, page]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    setConfirmDeleteId(null);
    setError("");

    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Erro ao excluir");
      }
      // Remove from list
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((prev) => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Comentarios</h1>
        <p className="text-sm text-text-secondary mt-0.5">Moderacao de comentarios nos mercados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar comentarios..."
            value={search}
            onChange={(e) => updateParams({ search: e.target.value, page: "" })}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        {marketId && (
          <button
            onClick={() => updateParams({ market_id: "", page: "" })}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface text-sm text-text-secondary hover:bg-surface-raised transition-colors"
          >
            <Icon name="x" className="w-3.5 h-3.5" />
            Limpar filtro de mercado
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-down/10 border border-down/20 text-sm text-down">
          {error}
        </div>
      )}

      {/* Comments list */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="Nenhum comentario encontrado"
            description="Tente alterar os filtros de busca."
          />
        ) : (
          <div className="divide-y divide-border">
            {comments.map((comment) => {
              const isDeleting = deletingId === comment.id;
              return (
                <div key={comment.id} className={cn("p-4 hover:bg-surface-raised/50 transition-colors", isDeleting && "opacity-50")}>
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center shrink-0 overflow-hidden">
                      {comment.user_avatar_url ? (
                        <img src={comment.user_avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="user" className="w-4 h-4 text-text-tertiary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text">{comment.user_name || "Anonimo"}</span>
                        <span className="text-xs text-text-tertiary">@{comment.user_handle}</span>
                        <span className="text-xs text-text-tertiary">
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-text leading-relaxed mb-2 whitespace-pre-wrap break-words">
                        {comment.body}
                      </p>

                      <div className="flex items-center gap-4">
                        {/* Market link */}
                        <Link
                          href={`/mercado/${comment.market_slug}`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <Icon name="bar-chart" className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{comment.market_title}</span>
                        </Link>

                        {/* Likes */}
                        <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                          <Icon name="thumbs-up" className="w-3 h-3" />
                          {comment.likes}
                        </span>

                        {/* Delete */}
                        {confirmDeleteId === comment.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-down">Excluir?</span>
                            <button
                              onClick={() => handleDelete(comment.id)}
                              disabled={isDeleting}
                              className="text-xs font-medium text-down hover:underline"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-medium text-text-secondary hover:underline"
                            >
                              Nao
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(comment.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-down transition-colors"
                          >
                            <Icon name="x" className="w-3 h-3" />
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-tertiary">
            {total} comentario{total !== 1 ? "s" : ""} no total
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="h-8 px-3 rounded-md border border-border text-xs font-medium text-text-secondary hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="px-2 text-xs text-text-secondary">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="h-8 px-3 rounded-md border border-border text-xs font-medium text-text-secondary hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Proximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
