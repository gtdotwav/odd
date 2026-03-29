import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confianca e Seguranca",
  description: "Como a Odd garante mercados justos, resolucoes transparentes e disputas imparciais.",
};

export default function ConfiancaPage() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-text mb-3">Confianca e Seguranca</h1>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            A Odd foi construida com transparencia e justica como principios fundamentais.
            Aqui, explicamos como garantimos que os mercados sejam justos, as resolucoes transparentes
            e as disputas tratadas de forma imparcial.
          </p>

          {/* How we ensure fair markets */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text mb-3">Mercados justos</h2>
            <div className="space-y-3">
              {[
                {
                  icon: "shield",
                  title: "Prevencao de manipulacao",
                  description: "Monitoramos todas as operacoes em tempo real com algoritmos de deteccao de manipulacao de mercado. Padroes anomalos sao sinalizados automaticamente para revisao manual.",
                },
                {
                  icon: "bar-chart",
                  title: "Limites de posicao",
                  description: "Cada usuario tem limites de posicao por mercado para evitar concentracao excessiva e garantir que nenhum participante possa distorcer os precos sozinho.",
                },
                {
                  icon: "search",
                  title: "Regras claras e publicas",
                  description: "Cada mercado tem regras de resolucao, fontes de verificacao e data limite definidas antes da abertura e visiveis a todos os participantes.",
                },
                {
                  icon: "globe",
                  title: "Fontes oficiais",
                  description: "Resolucoes sao baseadas em fontes oficiais e publicas (IBGE, Banco Central, FIFA, CoinGecko, etc.), nunca em opiniao ou interpretacao subjetiva.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-4 rounded-lg border border-border bg-surface">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon name={item.icon} className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-1">{item.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Resolution process */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text mb-3">Processo de resolucao</h2>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              A resolucao de mercados segue um processo rigoroso e transparente com multiplas camadas de verificacao.
            </p>
            <div className="space-y-0">
              {[
                {
                  step: "1",
                  title: "Verificacao automatica",
                  description: "Quando a data limite chega ou o evento ocorre, nosso sistema verifica automaticamente o resultado nas fontes oficiais definidas.",
                  time: "Automatico",
                },
                {
                  step: "2",
                  title: "Revisao humana",
                  description: "Um membro do time de operacoes revisa o resultado antes de confirma-lo. Em casos ambiguos, dois revisores sao necessarios.",
                  time: "Ate 2 horas",
                },
                {
                  step: "3",
                  title: "Resolucao preliminar",
                  description: "O resultado e publicado como preliminar e visivel a todos os participantes. Neste momento, os pagamentos ainda nao sao processados.",
                  time: "Publicacao",
                },
                {
                  step: "4",
                  title: "Periodo de contestacao",
                  description: "Usuarios tem 48 horas para contestar a resolucao apresentando evidencias. Contestacoes sao avaliadas por um comite independente.",
                  time: "48 horas",
                },
                {
                  step: "5",
                  title: "Resolucao final",
                  description: "Apos o periodo de contestacao (e resolucao de eventuais disputas), o resultado e considerado final e os pagamentos sao processados.",
                  time: "Pagamento",
                },
              ].map((item, index) => (
                <div key={item.step} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {item.step}
                    </div>
                    {index < 4 && <div className="w-px flex-1 bg-border my-1" />}
                  </div>
                  {/* Content */}
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text">{item.title}</h3>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-raised text-text-tertiary">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Dispute mechanism */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text mb-3">Mecanismo de disputas</h2>
            <div className="p-5 rounded-lg border border-border bg-surface space-y-4 text-sm text-text-secondary leading-relaxed">
              <p>
                Se voce acredita que a resolucao de um mercado esta incorreta, voce pode abrir uma contestacao durante o periodo de 48 horas apos a resolucao preliminar.
              </p>
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Como contestar:</h3>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>Acesse a pagina do mercado resolvido.</li>
                  <li>Clique em &quot;Contestar resolucao&quot; dentro do periodo de 48h.</li>
                  <li>Apresente evidencias (links, documentos, capturas de tela) que suportem sua contestacao.</li>
                  <li>Nosso comite de resolucao avaliara o caso em ate 24 horas.</li>
                </ol>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Possiveis resultados:</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong className="text-text">Resolucao mantida</strong>: a contestacao e rejeitada e a resolucao original prevalece.</li>
                  <li><strong className="text-text">Resolucao revertida</strong>: o comite reconhece o erro e o mercado e resolvido com o resultado correto.</li>
                  <li><strong className="text-text">Mercado anulado</strong>: em casos de ambiguidade irresolvivel, o mercado pode ser anulado e todos os participantes sao reembolsados ao preco medio de aquisicao.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-text mb-3">Seguranca da plataforma</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "Criptografia TLS", description: "Todas as comunicacoes sao protegidas com criptografia em transito." },
                { title: "Dados criptografados", description: "Dados sensiveis sao criptografados em repouso com AES-256." },
                { title: "Autenticacao segura", description: "Login com verificacao em duas etapas (2FA) disponivel." },
                { title: "Monitoramento 24/7", description: "Deteccao de anomalias e resposta a incidentes em tempo real." },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-lg border border-border bg-surface">
                  <h3 className="text-sm font-semibold text-text mb-1">{item.title}</h3>
                  <p className="text-xs text-text-secondary">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="p-5 rounded-lg border border-border bg-surface-raised text-center">
            <p className="text-sm text-text-secondary mb-3">
              Tem duvidas sobre seguranca ou integridade da plataforma?
            </p>
            <Link
              href="/suporte"
              className="inline-flex px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
            >
              Fale com o suporte
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
