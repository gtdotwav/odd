import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Suporte",
  description: "Central de ajuda da Odd. Perguntas frequentes e contato.",
};

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "O que e um mercado de previsao?",
    answer: "Um mercado de previsao e uma plataforma onde voce pode comprar e vender contratos baseados em eventos futuros. O preco de cada contrato reflete a probabilidade estimada pelo mercado. Contratos corretos pagam R$ 1,00; incorretos, R$ 0,00.",
  },
  {
    question: "Como faco meu primeiro deposito?",
    answer: "Acesse sua Carteira, clique em 'Depositar' e escolha o valor. Voce recebera um QR Code Pix para pagamento instantaneo. O deposito minimo e de R$ 5,00.",
  },
  {
    question: "Quanto tempo leva para um saque ser processado?",
    answer: "Saques via Pix sao processados em ate 30 minutos durante horario comercial (8h-20h). Fora desse horario, podem levar ate 2 horas. O saque minimo e de R$ 10,00.",
  },
  {
    question: "Como funciona a resolucao de mercados?",
    answer: "Cada mercado tem regras claras de resolucao e uma fonte oficial de verificacao. Quando o evento ocorre (ou a data limite chega), o mercado e resolvido. Ha um periodo de contestacao de 48h apos a resolucao.",
  },
  {
    question: "Posso vender meus contratos antes da resolucao?",
    answer: "Sim. Voce pode vender seus contratos a qualquer momento antes da resolucao do mercado, pelo preco atual de mercado ou definindo um preco limite.",
  },
  {
    question: "Quais sao as taxas da Odd?",
    answer: "A Odd cobra uma taxa de 2% sobre o valor de cada operacao executada. Nao ha taxas para depositos ou saques via Pix.",
  },
  {
    question: "Existe um limite de valor por operacao?",
    answer: "Sim. O deposito maximo e de R$ 50.000,00 e o saque maximo e de R$ 50.000,00 por transacao. Limites de operacao por mercado podem variar.",
  },
  {
    question: "Meus dados estao seguros?",
    answer: "Sim. Utilizamos criptografia em transito e em repouso, controles de acesso rigorosos e monitoramento continuo. Somos compativeis com a LGPD. Veja nossa Politica de Privacidade para mais detalhes.",
  },
  {
    question: "Preciso declarar meus ganhos no Imposto de Renda?",
    answer: "Recomendamos que voce consulte um contador ou profissional tributario. Ganhos em mercados de previsao podem estar sujeitos a tributacao conforme a legislacao vigente.",
  },
  {
    question: "Como contesto a resolucao de um mercado?",
    answer: "Apos a resolucao, ha um periodo de 48 horas para contestacao. Va ate a pagina do mercado e clique em 'Contestar resolucao'. Apresente evidencias e nosso time avaliara o caso.",
  },
];

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <details className="group rounded-lg border border-border bg-surface">
      <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer text-sm font-medium text-text hover:bg-surface-raised transition-colors rounded-lg">
        {item.question}
        <Icon
          name="chevron-right"
          className="w-4 h-4 text-text-tertiary shrink-0 transition-transform group-open:rotate-90"
        />
      </summary>
      <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed">
        {item.answer}
      </div>
    </details>
  );
}

export default function SuportePage() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-text mb-2">Suporte</h1>
          <p className="text-sm text-text-secondary mb-8">
            Encontre respostas para as perguntas mais comuns ou entre em contato com nosso time.
          </p>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
              Perguntas frequentes
            </h2>
            <div className="space-y-2">
              {faqItems.map((item) => (
                <FaqCard key={item.question} item={item} />
              ))}
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
              Contato
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-5 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="share" className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-text">E-mail</h3>
                </div>
                <p className="text-sm text-text-secondary mb-2">
                  Para duvidas gerais, problemas com sua conta ou sugestoes.
                </p>
                <a href="mailto:suporte@oddbr.com" className="text-sm text-accent hover:underline font-medium">
                  suporte@oddbr.com
                </a>
              </div>
              <div className="p-5 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="shield" className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-text">Seguranca</h3>
                </div>
                <p className="text-sm text-text-secondary mb-2">
                  Para reportar vulnerabilidades ou atividades suspeitas.
                </p>
                <a href="mailto:seguranca@oddbr.com" className="text-sm text-accent hover:underline font-medium">
                  seguranca@oddbr.com
                </a>
              </div>
              <div className="p-5 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="building" className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-text">Juridico</h3>
                </div>
                <p className="text-sm text-text-secondary mb-2">
                  Para questoes legais, termos de uso e privacidade.
                </p>
                <a href="mailto:legal@oddbr.com" className="text-sm text-accent hover:underline font-medium">
                  legal@oddbr.com
                </a>
              </div>
              <div className="p-5 rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="globe" className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-text">Redes sociais</h3>
                </div>
                <p className="text-sm text-text-secondary mb-2">
                  Siga-nos para novidades, analises e novos mercados.
                </p>
                <p className="text-sm text-accent font-medium">@oddbrasiloficial</p>
              </div>
            </div>
          </section>

          {/* Response time */}
          <div className="mt-8 p-4 rounded-lg border border-border bg-surface-raised text-center">
            <p className="text-xs text-text-tertiary">
              Tempo medio de resposta: <strong className="text-text">ate 24 horas uteis</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
