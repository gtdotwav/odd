import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Recompensas",
  description: "Programa de recompensas e indicacao da Odd — em breve.",
};

export default function RecompensasPage() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <h1 className="text-xl font-bold text-text mb-6">Recompensas</h1>

        {/* Coming soon hero */}
        <div className="p-8 rounded-xl border border-border bg-gradient-to-br from-highlight/5 via-surface to-surface text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-highlight/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="gift" className="w-8 h-8 text-highlight" />
          </div>
          <h2 className="text-lg font-bold text-text mb-2">Em breve</h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            Estamos preparando um programa de recompensas e indicacao para voce.
            Ganhe bonus por convidar amigos, completar desafios e participar ativamente da plataforma.
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-highlight/10 text-highlight text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-highlight animate-pulse-live" />
            Em desenvolvimento
          </span>
        </div>

        {/* Teaser features */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            O que esperar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-5 rounded-lg border border-border bg-surface">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <Icon name="share" className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">Programa de indicacao</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Convide amigos e ganhe bonus quando eles fizerem o primeiro deposito e operacao.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-border bg-surface">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <Icon name="trophy" className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">Desafios semanais</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Complete desafios como &quot;Faca 5 trades na semana&quot; e ganhe recompensas exclusivas.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-border bg-surface">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <Icon name="star" className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">Niveis de fidelidade</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Quanto mais voce participa, mais beneficios desbloqueia: taxas reduzidas, acesso antecipado e mais.
              </p>
            </div>
          </div>
        </section>

        {/* Email notify */}
        <div className="p-5 rounded-lg border border-border bg-surface text-center">
          <p className="text-sm text-text-secondary mb-3">
            Quer ser avisado quando o programa de recompensas for lancado?
          </p>
          <button
            type="button"
            className="px-5 py-2.5 rounded-lg bg-highlight hover:bg-highlight-hover text-white text-sm font-semibold transition-colors"
          >
            Me avise quando lancar
          </button>
        </div>
      </main>
    </div>
  );
}
