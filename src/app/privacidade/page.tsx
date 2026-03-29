import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Politica de Privacidade",
  description: "Politica de privacidade da Odd — como coletamos, usamos e protegemos seus dados pessoais.",
};

const lastUpdated = "29 de marco de 2026";

export default function PrivacidadePage() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-text mb-2">Politica de Privacidade</h1>
          <p className="text-xs text-text-tertiary mb-2">Ultima atualizacao: {lastUpdated}</p>
          <p className="text-sm text-text-secondary mb-8">
            Esta Politica de Privacidade descreve como a Odd Tecnologia Ltda. (&quot;Odd&quot;, &quot;nos&quot;) coleta, utiliza, armazena e protege os dados pessoais dos usuarios da plataforma, em conformidade com a Lei Geral de Protecao de Dados Pessoais (Lei n. 13.709/2018 — LGPD).
          </p>

          <div className="prose-custom space-y-8 text-sm text-text-secondary leading-relaxed">
            {/* 1. Dados coletados */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">1. Dados Coletados</h2>
              <p>Coletamos os seguintes dados pessoais:</p>
              <div className="mt-3 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-text">Dados de cadastro</h3>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Nome completo, CPF, data de nascimento, e-mail e telefone.</li>
                    <li>Endereco residencial (para fins de verificacao de identidade).</li>
                    <li>Foto de documento de identidade (quando exigida pela verificacao KYC).</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">Dados de uso</h3>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Historico de operacoes (compras, vendas, depositos, saques).</li>
                    <li>Mercados visitados, watchlist, preferencias de notificacao.</li>
                    <li>Enderecos IP, tipo de dispositivo, navegador e sistema operacional.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">Dados financeiros</h3>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Chaves Pix utilizadas para depositos e saques.</li>
                    <li>Historico de transacoes financeiras na Plataforma.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Finalidade */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">2. Finalidade do Tratamento</h2>
              <p>Seus dados pessoais sao utilizados para:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Criar e manter sua conta na Plataforma.</li>
                <li>Processar operacoes de compra, venda, deposito e saque.</li>
                <li>Verificar sua identidade e prevenir fraudes (KYC/AML).</li>
                <li>Enviar notificacoes sobre suas operacoes e mercados de interesse.</li>
                <li>Melhorar a experiencia do usuario e desenvolver novos recursos.</li>
                <li>Cumprir obrigacoes legais e regulatorias.</li>
                <li>Gerar estatisticas agregadas e anonimizadas sobre o uso da Plataforma.</li>
              </ul>
            </section>

            {/* 3. Base legal */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">3. Base Legal</h2>
              <p>O tratamento dos seus dados pessoais fundamenta-se nas seguintes bases legais previstas na LGPD:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong className="text-text">Execucao de contrato</strong> (Art. 7, V): processamento de operacoes, manutencao de conta.</li>
                <li><strong className="text-text">Cumprimento de obrigacao legal</strong> (Art. 7, II): verificacao KYC/AML, obrigacoes fiscais.</li>
                <li><strong className="text-text">Legitimo interesse</strong> (Art. 7, IX): prevencao de fraudes, melhoria da Plataforma, analytics.</li>
                <li><strong className="text-text">Consentimento</strong> (Art. 7, I): envio de comunicacoes de marketing, cookies nao essenciais.</li>
              </ul>
            </section>

            {/* 4. Compartilhamento */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">4. Compartilhamento de Dados</h2>
              <p>Seus dados pessoais podem ser compartilhados com:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong className="text-text">Provedores de servicos</strong>: processadores de pagamento (Pix), provedores de autenticacao, servicos de hospedagem e infraestrutura.</li>
                <li><strong className="text-text">Autoridades regulatorias</strong>: quando exigido por lei, decisao judicial ou requisicao de autoridade competente.</li>
                <li><strong className="text-text">Parceiros de verificacao</strong>: servicos de verificacao de identidade e prevencao de fraude.</li>
              </ul>
              <p className="mt-2">
                Nao vendemos, alugamos ou comercializamos seus dados pessoais a terceiros para fins de marketing.
              </p>
            </section>

            {/* 5. Retencao */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">5. Retencao de Dados</h2>
              <p>
                Seus dados pessoais sao retidos pelo tempo necessario para cumprir as finalidades descritas nesta Politica, observados os seguintes prazos:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong className="text-text">Dados de conta</strong>: enquanto a conta estiver ativa, e por 5 (cinco) anos apos o encerramento.</li>
                <li><strong className="text-text">Dados de transacoes</strong>: 5 (cinco) anos, conforme legislacao fiscal e financeira.</li>
                <li><strong className="text-text">Dados de KYC</strong>: 5 (cinco) anos apos o encerramento da conta, conforme normas de prevencao a lavagem de dinheiro.</li>
                <li><strong className="text-text">Logs de acesso</strong>: 6 (seis) meses, conforme o Marco Civil da Internet (Lei 12.965/2014).</li>
              </ul>
            </section>

            {/* 6. Direitos do titular */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">6. Direitos do Titular</h2>
              <p>
                Nos termos da LGPD, voce tem direito a:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong className="text-text">Confirmacao</strong> da existencia de tratamento de seus dados.</li>
                <li><strong className="text-text">Acesso</strong> aos dados pessoais que mantemos sobre voce.</li>
                <li><strong className="text-text">Correcao</strong> de dados incompletos, inexatos ou desatualizados.</li>
                <li><strong className="text-text">Anonimizacao, bloqueio ou eliminacao</strong> de dados desnecessarios ou excessivos.</li>
                <li><strong className="text-text">Portabilidade</strong> dos dados a outro fornecedor de servico.</li>
                <li><strong className="text-text">Eliminacao</strong> dos dados tratados com base no consentimento.</li>
                <li><strong className="text-text">Informacao</strong> sobre entidades publicas e privadas com as quais compartilhamos dados.</li>
                <li><strong className="text-text">Revogacao do consentimento</strong> a qualquer momento.</li>
              </ul>
              <p className="mt-2">
                Para exercer seus direitos, envie uma solicitacao para{" "}
                <a href="mailto:privacidade@oddbr.com" className="text-accent hover:underline">privacidade@oddbr.com</a>.
                Responderemos em ate 15 (quinze) dias uteis.
              </p>
            </section>

            {/* 7. Cookies */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">7. Cookies e Tecnologias Similares</h2>
              <p>Utilizamos cookies para:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong className="text-text">Cookies essenciais</strong>: autenticacao, seguranca, preferencias de sessao. Estritamente necessarios.</li>
                <li><strong className="text-text">Cookies de analytics</strong>: compreensao do uso da Plataforma, metricas de performance. Coletados mediante consentimento.</li>
                <li><strong className="text-text">Cookies de preferencias</strong>: personalizacao da experiencia (ex: tema, idioma). Coletados mediante consentimento.</li>
              </ul>
              <p className="mt-2">
                Voce pode gerenciar suas preferencias de cookies a qualquer momento nas configuracoes da Plataforma ou do seu navegador.
              </p>
            </section>

            {/* 8. Seguranca */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">8. Seguranca dos Dados</h2>
              <p>
                Adotamos medidas tecnicas e administrativas adequadas para proteger seus dados pessoais contra acessos nao autorizados, perda, destruicao ou alteracao, incluindo:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Criptografia em transito (TLS) e em repouso.</li>
                <li>Controles de acesso baseados em funcao (RBAC).</li>
                <li>Monitoramento continuo de seguranca e deteccao de anomalias.</li>
                <li>Testes periodicos de seguranca e auditorias.</li>
              </ul>
            </section>

            {/* 9. Contato DPO */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">9. Encarregado de Dados (DPO)</h2>
              <p>
                O Encarregado pelo Tratamento de Dados Pessoais da Odd pode ser contatado pelo e-mail:
              </p>
              <p className="mt-2">
                <a href="mailto:dpo@oddbr.com" className="text-accent hover:underline font-medium">dpo@oddbr.com</a>
              </p>
              <p className="mt-2">
                Voce tambem pode entrar em contato com a Autoridade Nacional de Protecao de Dados (ANPD) pelo site{" "}
                <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.gov.br/anpd</a>.
              </p>
            </section>

            {/* 10. Alteracoes */}
            <section>
              <h2 className="text-base font-bold text-text mb-2">10. Alteracoes nesta Politica</h2>
              <p>
                Esta Politica de Privacidade pode ser atualizada periodicamente. Notificaremos voce sobre alteracoes significativas por e-mail ou por aviso na Plataforma. A continuidade do uso da Plataforma apos a notificacao constitui aceitacao das alteracoes.
              </p>
            </section>

            {/* Contact */}
            <section className="pt-4 border-t border-border">
              <p>
                Duvidas sobre esta Politica? Entre em contato pelo e-mail{" "}
                <a href="mailto:privacidade@oddbr.com" className="text-accent hover:underline">privacidade@oddbr.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
