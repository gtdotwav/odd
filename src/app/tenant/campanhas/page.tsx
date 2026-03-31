"use client";

import Icon from "@/components/Icon";

export default function TenantCampanhas() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Campanhas de Captacao</h1>
        <p className="text-sm text-white/50 mt-0.5">Gerencie campanhas de aquisicao de usuarios</p>
      </div>

      {/* UTM Links */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">Links de Captacao</h2>
        <p className="text-xs text-white/40 mb-4">
          Use esses links rastreados para medir a eficacia de cada canal de aquisicao.
        </p>
        <div className="space-y-3">
          {[
            { channel: "Instagram", utm: "utm_source=instagram&utm_medium=social&utm_campaign=organic", icon: "share" },
            { channel: "Twitter/X", utm: "utm_source=twitter&utm_medium=social&utm_campaign=organic", icon: "share" },
            { channel: "WhatsApp", utm: "utm_source=whatsapp&utm_medium=referral&utm_campaign=invite", icon: "inbox" },
            { channel: "Google Ads", utm: "utm_source=google&utm_medium=cpc&utm_campaign=search", icon: "zap" },
            { channel: "Parceiros", utm: "utm_source=partner&utm_medium=referral&utm_campaign=affiliate", icon: "users" },
          ].map((link) => {
            const url = `https://oddbr.com/auth/cadastro?${link.utm}`;
            return (
              <div key={link.channel} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className="w-8 h-8 rounded-full bg-highlight/10 flex items-center justify-center shrink-0">
                  <Icon name={link.icon} className="w-4 h-4 text-highlight" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{link.channel}</p>
                  <p className="text-[10px] text-white/30 truncate font-mono">{url}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(url)}
                  className="px-3 py-1.5 rounded-md bg-white/5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                >
                  Copiar
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral Program */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
        <h2 className="text-sm font-semibold mb-2">Programa de Indicacao</h2>
        <p className="text-xs text-white/40 mb-4">
          Configure recompensas para usuarios que indicarem novos membros.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/40 mb-1">Bonus por indicacao</p>
            <p className="text-lg font-mono font-bold text-emerald-400">R$ 5,00</p>
            <p className="text-[10px] text-white/30 mt-1">Creditado ao indicador quando indicado faz primeiro deposito</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/40 mb-1">Bonus indicado</p>
            <p className="text-lg font-mono font-bold text-blue-400">R$ 5,00</p>
            <p className="text-[10px] text-white/30 mt-1">Creditado ao novo usuario apos primeiro deposito</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400">
            <Icon name="alert-triangle" className="w-3.5 h-3.5 inline mr-1" />
            Sistema de indicacao em desenvolvimento. Ative em breve via Configuracoes.
          </p>
        </div>
      </div>

      {/* Channel Ideas */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold mb-4">Estrategias de Captacao</h2>
        <div className="space-y-2">
          {[
            { title: "Mercados Virais", desc: "Criar mercados sobre temas trending no Twitter/X para atrair trafico organico", status: "Ativo" },
            { title: "Bonus Primeiro Deposito", desc: "Oferecer credito de R$ 10 para novos usuarios que depositarem", status: "Em breve" },
            { title: "Torneios Semanais", desc: "Rankings semanais com premios para top traders, incentivando competicao", status: "Em breve" },
            { title: "API para Embeds", desc: "Permitir que sites de noticias embedem widgets de mercados da Odd", status: "Planejado" },
            { title: "Programa Afiliados", desc: "Comissao recorrente de 1% do volume para afiliados que trouxerem traders ativos", status: "Planejado" },
          ].map((s) => (
            <div key={s.title} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <Icon name="zap" className="w-4 h-4 text-highlight mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{s.title}</p>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    s.status === "Ativo" ? "bg-emerald-500/15 text-emerald-400" :
                    s.status === "Em breve" ? "bg-amber-500/15 text-amber-400" :
                    "bg-white/10 text-white/40"
                  }`}>{s.status}</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
