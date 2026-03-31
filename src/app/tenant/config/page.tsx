"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export default function TenantConfig() {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Configuracoes</h1>
        <p className="text-sm text-white/50 mt-0.5">Configuracoes do painel tenant</p>
      </div>

      {/* Platform Settings */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">Configuracoes da Plataforma</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Nome da Plataforma</label>
            <input
              type="text"
              defaultValue="Odd"
              className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-highlight/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Dominio</label>
            <input
              type="text"
              defaultValue="oddbr.com"
              className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-highlight/50"
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Taxa padrao de mercado (fee_rate)</label>
            <input
              type="text"
              defaultValue="2%"
              className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-highlight/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Deposito minimo (BRL)</label>
            <input
              type="number"
              defaultValue="5"
              className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-highlight/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1.5">Saque minimo (BRL)</label>
            <input
              type="number"
              defaultValue="10"
              className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-highlight/50"
            />
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">Integracoes</h2>
        <div className="space-y-3">
          {[
            { name: "Clerk (Auth)", status: "Conectado", connected: true },
            { name: "Supabase (Database)", status: "Conectado", connected: true },
            { name: "Polymarket (Data Feed)", status: "Conectado", connected: true },
            { name: "Asaas (PIX Payments)", status: "Nao configurado", connected: false },
            { name: "Google Analytics", status: "Nao configurado", connected: false },
            { name: "Hotjar (Heatmaps)", status: "Nao configurado", connected: false },
          ].map((integ) => (
            <div key={integ.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${integ.connected ? "bg-emerald-400" : "bg-white/20"}`} />
                <span className="text-sm">{integ.name}</span>
              </div>
              <span className={`text-xs ${integ.connected ? "text-emerald-400" : "text-white/40"}`}>
                {integ.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Access */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">Acessos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-white/30 border-b border-white/10">
                <th className="py-2 pr-4">Painel</th>
                <th className="py-2 pr-4">URL</th>
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2">Senha</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-white">Admin</td>
                <td className="py-3 pr-4 font-mono text-xs">/admin</td>
                <td className="py-3 pr-4 font-mono text-xs">admin</td>
                <td className="py-3 font-mono text-xs">admin123@</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-white">Tenant</td>
                <td className="py-3 pr-4 font-mono text-xs">/tenant</td>
                <td className="py-3 pr-4 font-mono text-xs">tenant</td>
                <td className="py-3 font-mono text-xs">tenant123@</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-white">Usuario</td>
                <td className="py-3 pr-4 font-mono text-xs">/auth/login</td>
                <td className="py-3 pr-4 text-xs text-white/40" colSpan={2}>Via Clerk (Google/GitHub/Email)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-2.5 rounded-lg bg-highlight hover:bg-highlight-hover text-white text-sm font-medium transition-colors flex items-center gap-2"
      >
        {saved ? (
          <>
            <Icon name="check" className="w-4 h-4" />
            Salvo
          </>
        ) : (
          <>
            <Icon name="check" className="w-4 h-4" />
            Salvar Alteracoes
          </>
        )}
      </button>
    </div>
  );
}
