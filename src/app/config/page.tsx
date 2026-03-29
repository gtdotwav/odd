"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultNotifications: NotificationPref[] = [
  { key: "trade_filled", label: "Ordens executadas", description: "Receba um aviso quando sua ordem for executada.", enabled: true },
  { key: "market_resolved", label: "Mercados resolvidos", description: "Notificacao quando um mercado da sua watchlist for resolvido.", enabled: true },
  { key: "price_alert", label: "Alertas de preco", description: "Avisos quando precos atingirem seus limites definidos.", enabled: false },
  { key: "new_follower", label: "Novos seguidores", description: "Alguem comecou a seguir voce.", enabled: true },
  { key: "comment_reply", label: "Respostas a comentarios", description: "Alguem respondeu ao seu comentario.", enabled: true },
  { key: "newsletter", label: "Newsletter semanal", description: "Resumo semanal dos principais mercados e movimentos.", enabled: false },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-accent" : "bg-border-strong"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function ConfigPage() {
  const [displayName, setDisplayName] = useState("Joao Silva");
  const [handle, setHandle] = useState("joao_silva");
  const [bio, setBio] = useState("Entusiasta de mercados de previsao. Analista macro.");
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [saved, setSaved] = useState(false);

  function toggleNotification(key: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
  }

  function handleSave() {
    // TODO: save to API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <h1 className="text-xl font-bold text-text mb-6">Configuracoes</h1>

        {/* Profile section */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Perfil
          </h2>
          <div className="p-5 rounded-lg border border-border bg-surface space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-xl font-bold text-accent">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <button
                  type="button"
                  className="text-sm text-accent hover:underline font-medium"
                >
                  Alterar foto
                </button>
                <p className="text-xs text-text-tertiary mt-0.5">JPG, PNG. Max 2MB.</p>
              </div>
            </div>

            {/* Display name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-text mb-1.5">
                Nome de exibicao
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            {/* Handle */}
            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-text mb-1.5">
                Handle
              </label>
              <div className="flex items-center max-w-md">
                <span className="px-3 py-2 rounded-l-lg border border-r-0 border-border bg-surface-raised text-sm text-text-tertiary">@</span>
                <input
                  id="handle"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-r-lg border border-border bg-surface text-sm text-text focus:border-accent focus:outline-none transition-colors"
                />
              </div>
              <p className="text-xs text-text-tertiary mt-1">oddbr.com/u/{handle}</p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-text mb-1.5">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
                className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:border-accent focus:outline-none transition-colors resize-none"
              />
              <p className="text-xs text-text-tertiary mt-1">{bio.length}/200</p>
            </div>
          </div>
        </section>

        {/* Notifications section */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Notificacoes
          </h2>
          <div className="rounded-lg border border-border bg-surface divide-y divide-border">
            {notifications.map((notif) => (
              <div key={notif.key} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-text">{notif.label}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{notif.description}</p>
                </div>
                <Toggle enabled={notif.enabled} onChange={() => toggleNotification(notif.key)} />
              </div>
            ))}
          </div>
        </section>

        {/* Theme section */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Aparencia
          </h2>
          <div className="p-5 rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-accent bg-accent/5">
                <div className="w-5 h-5 rounded-full bg-white border border-border" />
                <span className="text-sm font-medium text-text">Claro</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border opacity-50 cursor-not-allowed">
                <div className="w-5 h-5 rounded-full bg-gray-800 border border-gray-600" />
                <span className="text-sm font-medium text-text-tertiary">Escuro</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-text-tertiary bg-surface-raised px-1.5 py-0.5 rounded">
                  Em breve
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
          >
            Salvar alteracoes
          </button>
          {saved && (
            <span className="text-sm text-up font-medium animate-slide-up">
              Salvo com sucesso!
            </span>
          )}
        </div>
      </main>
    </div>
  );
}
