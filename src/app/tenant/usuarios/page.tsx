"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";

interface User {
  id: string;
  clerk_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  kyc_status: string;
  role: string;
  created_at: string;
  balance: number;
}

const kycConfig: Record<string, { label: string; className: string }> = {
  none: { label: "Sem KYC", className: "bg-white/10 text-white/50" },
  pending: { label: "Pendente", className: "bg-amber-500/15 text-amber-400" },
  verified: { label: "Verificado", className: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Rejeitado", className: "bg-red-500/15 text-red-400" },
};

export default function TenantUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (kycFilter) params.set("kyc_status", kycFilter);
    params.set("limit", "50");

    fetch(`/api/tenant/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [search, kycFilter]);

  const totalBalance = users.reduce((sum, u) => sum + (u.balance ?? 0), 0);
  const withBalance = users.filter((u) => u.balance > 0).length;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Usuarios</h1>
          <p className="text-sm text-white/50 mt-0.5">{total} usuarios registrados</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Saldo Total Usuarios</p>
          <p className="text-lg font-mono font-bold">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Com Saldo</p>
          <p className="text-lg font-mono font-bold">{withBalance} / {users.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Exibindo</p>
          <p className="text-lg font-mono font-bold">{users.length} / {total}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por handle ou nome..."
            className="flex-1 h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-highlight/50"
          />
          <button type="submit" className="px-4 h-9 rounded-lg bg-highlight text-white text-xs font-medium hover:bg-highlight-hover transition-colors">
            Buscar
          </button>
        </form>
        <div className="flex items-center gap-2 overflow-x-auto">
          {["", "none", "pending", "verified", "rejected"].map((k) => (
            <button
              key={k}
              onClick={() => setKycFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                kycFilter === k ? "bg-highlight text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {k === "" ? "Todos" : kycConfig[k]?.label ?? k}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="users" className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Nenhum usuario encontrado</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
            <div className="col-span-4">Usuario</div>
            <div className="col-span-2">KYC</div>
            <div className="col-span-2">Saldo</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Cadastro</div>
          </div>

          {users.map((u) => {
            const kyc = kycConfig[u.kyc_status] ?? kycConfig.none;
            const date = new Date(u.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
            return (
              <div key={u.id} className="grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors">
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="user" className="w-4 h-4 text-white/40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.display_name || u.handle}</p>
                    <p className="text-[10px] text-white/40 truncate">@{u.handle}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${kyc.className}`}>
                    {kyc.label}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-mono font-medium">{formatCurrency(u.balance)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-white/50 capitalize">{u.role}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-white/40">{date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
