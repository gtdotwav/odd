"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(
          data.error === "invalid_credentials"
            ? "Email ou senha incorretos"
            : "Erro ao fazer login",
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="lock" className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-white">Odd Admin</h1>
          <p className="text-sm text-white/50 mt-1">
            Acesso restrito ao painel administrativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-white/60 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
              placeholder="admin"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-white/60 mb-1.5"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-down/10 border border-down/20">
              <Icon name="alert-triangle" className="w-4 h-4 text-down shrink-0" />
              <p className="text-xs text-down">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Icon name="lock" className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
