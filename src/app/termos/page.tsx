import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso da plataforma Odd — mercado de previsoes.",
};

const lastUpdated = "29 de marco de 2026";

export default function TermosPage() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-text mb-2">Termos de Uso</h1>
          <p className="text-xs text-text-tertiary mb-8">Ultima atualizacao: {lastUpdated}</p>

          <div className="prose-custom space-y-8 text-sm text-text-secondary leading-relaxed">
            {/* 1. Definicoes */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">1. Definicoes</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-text">Odd</strong> ou <strong className="text-text">Plataforma</strong>: a plataforma digital de mercados de previsao operada pela Odd Tecnologia Ltda., inscrita no CNPJ sob o numero [a definir], com sede em [cidade], Brasil.</li>
                <li><strong className="text-text">Usuario</strong>: qualquer pessoa fisica que se cadastre e utilize a Plataforma.</li>
                <li><strong className="text-text">Mercado</strong>: pergunta sobre um evento futuro na qual os usuarios podem negociar contratos de Sim ou Nao.</li>
                <li><strong className="text-text">Contrato</strong>: instrumento digital que paga R$ 1,00 se o evento ocorrer (Sim) ou R$ 0,00 se nao ocorrer (Nao).</li>
                <li><strong className="text-text">Ordem</strong>: instrucao de compra ou venda de contratos, podendo ser do tipo market (executada ao preco de mercado) ou limit (executada a um preco especifico).</li>
                <li><strong className="text-text">Carteira</strong>: saldo em Reais (R$) do Usuario na Plataforma.</li>
                <li><strong className="text-text">Resolucao</strong>: processo pelo qual a Odd determina o resultado de um Mercado com base nas regras previamente definidas.</li>
              </ul>
            </section>

            {/* 2. Elegibilidade */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">2. Elegibilidade</h2>
              <p>Para utilizar a Plataforma, o Usuario deve:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Ter pelo menos 18 (dezoito) anos de idade.</li>
                <li>Possuir CPF valido e regular junto a Receita Federal.</li>
                <li>Residir em territorio brasileiro.</li>
                <li>Nao ser pessoa politicamente exposta (PEP) sem previa declaracao.</li>
                <li>Nao estar impedido por decisao judicial ou administrativa de realizar operacoes financeiras.</li>
              </ul>
            </section>

            {/* 3. Conta */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">3. Conta do Usuario</h2>
              <p>
                O cadastro e pessoal e intransferivel. O Usuario e responsavel por manter a confidencialidade de suas credenciais de acesso. Qualquer atividade realizada com suas credenciais sera de sua inteira responsabilidade.
              </p>
              <p className="mt-2">
                A Odd reserva-se o direito de suspender ou encerrar contas que violem estes Termos, apresentem atividade suspeita de fraude, manipulacao de mercado ou lavagem de dinheiro.
              </p>
            </section>

            {/* 4. Mercados */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">4. Mercados de Previsao</h2>
              <p>
                Os Mercados sao criados e gerenciados pela Odd. Cada Mercado possui regras claras de resolucao, fonte de verificacao e data limite. A Odd se reserva o direito de:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Criar, modificar ou cancelar Mercados a qualquer momento, mediante justificativa.</li>
                <li>Suspender a negociacao em um Mercado temporariamente por razoes operacionais ou regulatorias.</li>
                <li>Ajustar as regras de resolucao quando as regras originais se tornarem ambiguas, desde que com aviso previo.</li>
              </ul>
            </section>

            {/* 5. Negociacao */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">5. Negociacao</h2>
              <p>
                A negociacao de contratos e realizada por meio de um livro de ordens (order book) mantido pela Plataforma. O Usuario pode criar ordens de compra ou venda a precos entre R$ 0,01 e R$ 0,99.
              </p>
              <p className="mt-2">
                Uma vez executada, a ordem e irrevogavel. Ordens pendentes podem ser canceladas a qualquer momento antes de sua execucao.
              </p>
              <p className="mt-2">
                A Odd nao garante liquidez ou execucao de ordens limit. Ordens market sao executadas ao melhor preco disponivel.
              </p>
            </section>

            {/* 6. Taxas */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">6. Taxas</h2>
              <p>
                A Odd cobra uma taxa de 2% (dois por cento) sobre o valor de cada operacao executada. As taxas sao descontadas automaticamente no momento da execucao.
              </p>
              <p className="mt-2">
                Nao ha cobranca de taxas para depositos ou saques via Pix. A Odd reserva-se o direito de alterar a estrutura de taxas mediante aviso previo de 30 (trinta) dias.
              </p>
            </section>

            {/* 7. Resolucao */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">7. Resolucao de Mercados</h2>
              <p>
                Mercados sao resolvidos com base em fontes oficiais e publicas definidas nas regras de cada Mercado. Apos a resolucao, ha um periodo de contestacao de 48 (quarenta e oito) horas durante o qual qualquer Usuario pode apresentar evidencias de erro.
              </p>
              <p className="mt-2">
                Caso uma contestacao seja aceita, a Odd podera reverter a resolucao ou declarar o Mercado como nulo, reembolsando os usuarios ao preco medio de aquisicao.
              </p>
              <p className="mt-2">
                A decisao final da Odd sobre a resolucao de um Mercado e vinculante e definitiva, ressalvados os direitos do consumidor previstos em lei.
              </p>
            </section>

            {/* 8. Propriedade intelectual */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">8. Propriedade Intelectual</h2>
              <p>
                Todo o conteudo da Plataforma — incluindo mas nao se limitando a logotipos, design, textos, codigo-fonte, dados de mercado e algoritmos — e de propriedade exclusiva da Odd ou de seus licenciadores.
              </p>
              <p className="mt-2">
                O Usuario nao podera reproduzir, distribuir, modificar ou criar obras derivadas do conteudo da Plataforma sem autorizacao previa e por escrito.
              </p>
            </section>

            {/* 9. Limitacao de responsabilidade */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">9. Limitacao de Responsabilidade</h2>
              <p>
                A Odd nao se responsabiliza por perdas financeiras decorrentes de operacoes realizadas na Plataforma. Mercados de previsao envolvem risco, e o Usuario pode perder todo o valor investido em contratos.
              </p>
              <p className="mt-2">
                A Odd nao se responsabiliza por indisponibilidade temporaria da Plataforma, atrasos na execucao de ordens por razoes tecnicas ou de mercado, ou por decisoes de investimento tomadas pelo Usuario.
              </p>
              <p className="mt-2">
                Em nenhuma hipotese a responsabilidade total da Odd perante o Usuario excedera o valor dos depositos realizados pelo Usuario nos ultimos 12 (doze) meses.
              </p>
            </section>

            {/* 10. Lei aplicavel */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">10. Lei Aplicavel e Foro</h2>
              <p>
                Estes Termos sao regidos pelas leis da Republica Federativa do Brasil. Fica eleito o foro da comarca de Sao Paulo/SP para dirimir quaisquer controversias decorrentes destes Termos, ressalvado o direito do consumidor de optar pelo foro de seu domicilio.
              </p>
            </section>

            {/* Contact */}
            <section className="pt-4 border-t border-border">
              <p>
                Duvidas sobre estes Termos? Entre em contato pelo e-mail{" "}
                <a href="mailto:legal@oddbr.com" className="text-accent hover:underline">legal@oddbr.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
