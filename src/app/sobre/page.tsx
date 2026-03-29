import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre",
  description: "O que e a Odd e como funcionam os mercados de previsao.",
};

export default function SobrePage() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="max-w-2xl">
          {/* Hero */}
          <h1 className="text-2xl md:text-3xl font-bold text-text mb-3">Sobre a Odd</h1>
          <p className="text-text-secondary leading-relaxed mb-8">
            A Odd e o mercado de previsoes do Brasil. Aqui, voce negocia probabilidades sobre o que vai
            acontecer no pais e no mundo — de politica e economia a futebol, cripto e cultura pop.
          </p>

          {/* What is Odd */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text mb-3">O que e a Odd?</h2>
            <div className="p-5 rounded-lg border border-border bg-surface space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>
                A Odd e uma plataforma onde voce pode comprar e vender contratos baseados em
                eventos futuros. Cada contrato representa uma pergunta: &quot;Isso vai acontecer?&quot;
              </p>
              <p>
                Se o evento acontece, o contrato vale R$ 1,00. Se nao acontece, vale R$ 0,00.
                O preco de cada contrato reflete a probabilidade estimada pelo mercado.
              </p>
              <p>
                Por exemplo, se o contrato &quot;Selic sobe em maio?&quot; esta a R$ 0,78, o mercado
                esta dizendo que ha 78% de chance de a Selic subir.
              </p>
            </div>
          </section>

          {/* How it works */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text mb-3">Como funciona?</h2>
            <div className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Escolha um mercado",
                  description: "Navegue por categorias como Economia, Politica, Futebol, Cripto e mais. Cada mercado e uma pergunta sobre um evento futuro.",
                },
                {
                  step: "2",
                  title: "Compre Sim ou Nao",
                  description: "Se voce acha que o evento vai acontecer, compre Sim. Se acha que nao, compre Nao. O preco varia de R$ 0,01 a R$ 0,99.",
                },
                {
                  step: "3",
                  title: "Negocie a qualquer momento",
                  description: "Voce pode vender seus contratos antes da resolucao se mudar de ideia ou quiser realizar lucro.",
                },
                {
                  step: "4",
                  title: "Resolucao",
                  description: "Quando o evento acontece (ou a data limite chega), o mercado e resolvido. Contratos corretos pagam R$ 1,00; incorretos, R$ 0,00.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 rounded-lg border border-border bg-surface">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-1">{item.title}</h3>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why prediction markets */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text mb-3">Por que mercados de previsao?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  icon: "bar-chart",
                  title: "Precos = Probabilidades",
                  description: "Mercados agregam informacao dispersa e produzem estimativas mais precisas que pesquisas tradicionais.",
                },
                {
                  icon: "zap",
                  title: "Informacao em tempo real",
                  description: "Precos se ajustam instantaneamente a novas informacoes, refletindo as expectativas do mercado.",
                },
                {
                  icon: "shield",
                  title: "Incentivos alinhados",
                  description: "Quem tem informacao melhor ganha mais. Isso incentiva pesquisa e analise de qualidade.",
                },
                {
                  icon: "globe",
                  title: "Cobertura ampla",
                  description: "De eleicoes a jogos de futebol, de decisoes do Copom a lancamentos de tecnologia.",
                },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-lg border border-border bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name={item.icon} className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-semibold text-text">{item.title}</h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="p-6 rounded-xl border border-border bg-gradient-to-br from-accent/5 via-surface to-surface">
            <h2 className="text-lg font-bold text-text mb-2">Pronto para comecar?</h2>
            <p className="text-sm text-text-secondary mb-4">
              Explore os mercados ativos e faca sua primeira operacao.
            </p>
            <div className="flex gap-3">
              <Link
                href="/explorar"
                className="px-5 py-2.5 rounded-lg bg-highlight hover:bg-highlight-hover text-white text-sm font-semibold transition-colors"
              >
                Explorar mercados
              </Link>
              <Link
                href="/docs"
                className="px-5 py-2.5 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong text-sm font-medium transition-colors"
              >
                Ver documentacao
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
