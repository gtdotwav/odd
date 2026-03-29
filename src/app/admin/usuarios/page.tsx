"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  kyc_status: string;
  role: string;
  balance: number;
  total_orders: number;
  created_at: string;
}

const KYC_OPTIONS = [
  { value: "", label: "Todos os KYC" },
  { value: "none", label: "Sem KYC" },
  { value: "pending", label: "Pendente" },
  { value: "verified", label: "Verificado" },
  { value: "rejected", label: "Rejeitado" },
];

const ROLE_OPTIONS = [
  { value: "", label: "Todos os papeis" },
  { value: "user", label: "Usuario" },
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderador" },
];

const kycBadge: Record<string, { className: string; label: string }> = {
  none: { className: "bg-surface-raised text-text-tertiary", label: "Sem KYC" },
  pending: { className: "bg-neutral-warn/15 text-neutral-warn", label: "Pendente" },
  verified: { className: "bg-up/15 text-up", label: "Verificado" },
  rejected: { className: "bg-down/15 text-down", label: "Rejeitado" },
};

const roleBadge: Record<string, { className: string; label: string }> = {
  user: { className: "bg-surface-raised text-text-secondary", label: "Usuario" },
  admin: { className: "bg-accent/15 text-accent", label: "Admin" },
  moderator: { className: "bg-[#7C3AED]/15 text-[#7C3AED]", label: "Moderador" },
};

const PAGE_SIZE = 20;

export default function AdminUsuarios() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const search = searchParams.get("search") || "";
  const kycStatus = searchParams.get("kyc_status") || "";
  const role = searchParams.get("role") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      if (!("page" in updates)) params.delete("page");
      router.push(`/admin/usuarios?${params.toString()}`);
    },
    [searchParams, router],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (kycStatus) params.set("kyc_status", kycStatus);
      if (role) params.set("role", role);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String((page - 1) * PAGE_SIZE));

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar usuarios");
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [search, kycStatus, role, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleUpdateUser(userId: string, updates: { kyc_status?: string; role?: string }) {
    setUpdatingId(userId);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Erro ao atualizar");
      }
      // Refresh list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Usuarios</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por nome ou handle..."
            value={search}
            onChange={(e) => updateParams({ search: e.target.value, page: "" })}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <select
          value={kycStatus}
          onChange={(e) => updateParams({ kyc_status: e.target.value, page: "" })}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {KYC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => updateParams({ role: e.target.value, page: "" })}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-down/10 border border-down/20 text-sm text-down">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-4 flex-[2]" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon="users"
            title="Nenhum usuario encontrado"
            description="Tente alterar os filtros de busca."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pt-4 px-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Usuario</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Handle</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">KYC</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Papel</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Saldo</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Ordens</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Desde</th>
                    <th className="pb-3 pt-4 pr-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => {
                    const kyc = kycBadge[user.kyc_status] || kycBadge.none;
                    const roleB = roleBadge[user.role] || roleBadge.user;
                    const isUpdating = updatingId === user.id;

                    return (
                      <tr key={user.id} className={cn("hover:bg-surface-raised transition-colors", isUpdating && "opacity-60")}>
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0 overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon name="user" className="w-4 h-4 text-text-tertiary" />
                              )}
                            </div>
                            <span className="font-medium text-text truncate max-w-[150px]">{user.name || "Sem nome"}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-text-secondary">@{user.handle}</td>
                        <td className="py-3 pr-4">
                          <select
                            value={user.kyc_status}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateUser(user.id, { kyc_status: e.target.value })}
                            className={cn("px-2 py-0.5 rounded-full text-xs font-medium border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30", kyc.className)}
                          >
                            <option value="none">Sem KYC</option>
                            <option value="pending">Pendente</option>
                            <option value="verified">Verificado</option>
                            <option value="rejected">Rejeitado</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={user.role}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                            className={cn("px-2 py-0.5 rounded-full text-xs font-medium border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30", roleB.className)}
                          >
                            <option value="user">Usuario</option>
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderador</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-text-secondary">
                          {formatCurrency(user.balance)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-text-secondary">
                          {user.total_orders}
                        </td>
                        <td className="py-3 pr-4 text-xs text-text-secondary">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 pr-5 text-right">
                          {isUpdating && (
                            <svg className="w-4 h-4 animate-spin text-accent inline-block" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-border">
              {users.map((user) => {
                const kyc = kycBadge[user.kyc_status] || kycBadge.none;
                const roleB = roleBadge[user.role] || roleBadge.user;
                const isUpdating = updatingId === user.id;

                return (
                  <div key={user.id} className={cn("p-4 space-y-3", isUpdating && "opacity-60")}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="user" className="w-4.5 h-4.5 text-text-tertiary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{user.name || "Sem nome"}</p>
                        <p className="text-xs text-text-secondary">@{user.handle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", kyc.className)}>
                        {kyc.label}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", roleB.className)}>
                        {roleB.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span>Saldo: <span className="font-mono">{formatCurrency(user.balance)}</span></span>
                      <span>{user.total_orders} ordens</span>
                      <span>{formatDate(user.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.kyc_status}
                        disabled={isUpdating}
                        onChange={(e) => handleUpdateUser(user.id, { kyc_status: e.target.value })}
                        className="h-7 px-2 rounded-md border border-border bg-surface text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        <option value="none">KYC: Sem</option>
                        <option value="pending">KYC: Pendente</option>
                        <option value="verified">KYC: Verificado</option>
                        <option value="rejected">KYC: Rejeitado</option>
                      </select>
                      <select
                        value={user.role}
                        disabled={isUpdating}
                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                        className="h-7 px-2 rounded-md border border-border bg-surface text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        <option value="user">Papel: Usuario</option>
                        <option value="admin">Papel: Admin</option>
                        <option value="moderator">Papel: Moderador</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-tertiary">
            {total} usuario{total !== 1 ? "s" : ""} no total
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
