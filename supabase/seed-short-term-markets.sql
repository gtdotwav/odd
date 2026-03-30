-- Seed: Mercados de curto prazo (resolução em dias/semanas)
-- Data base: 2026-03-30

-- ============================================
-- ECONOMIA (próximos dias)
-- ============================================

INSERT INTO markets (slug, title, subtitle, category, type, status, price_yes, price_no, resolution_date, context, rules, source, featured, pool_yes, pool_no, pool_k, total_liquidity, fee_rate)
VALUES
('ibovespa-fecha-acima-132k-abril-2026', 'Ibovespa fecha acima de 132.000 em 1 de abril?', 'Índice da B3 no fechamento de terça-feira', 'Economia', 'binary', 'active', 0.55, 0.45, '2026-04-01T21:00:00Z', 'O Ibovespa tem oscilado entre 128K e 134K nas últimas semanas. Dados de emprego e inflação podem impactar.', 'Resolve SIM se Ibovespa fechar >= 132.000 no dia 01/04/2026 (fechamento oficial B3).', 'https://www.b3.com.br/', true, 1000, 1000, 1000000, 2000, 0.02),

('dolar-abaixo-5-70-abril-2026', 'Dólar vai fechar abaixo de R$5,70 até sexta?', 'Câmbio USD/BRL no fechamento de 04/04', 'Economia', 'binary', 'active', 0.42, 0.58, '2026-04-04T21:00:00Z', 'Dólar tem se mantido pressionado com juros altos nos EUA. Copom manteve Selic em 14,25%.', 'Resolve SIM se USD/BRL fechar < 5.70 no dia 04/04/2026 (PTAX de fechamento do BC).', 'https://www.bcb.gov.br/', true, 1000, 1000, 1000000, 2000, 0.02),

('selic-cai-maio-2026', 'Copom vai cortar a Selic na reunião de maio?', 'Próxima reunião do Copom: 6-7 de maio', 'Economia', 'binary', 'active', 0.30, 0.70, '2026-05-07T23:59:00Z', 'A Selic está em 14,25% desde janeiro. Inflação desacelerando mas acima da meta. Mercado dividido sobre próximo passo.', 'Resolve SIM se o Copom reduzir a taxa Selic na reunião de 6-7 de maio de 2026.', 'https://www.bcb.gov.br/controleinflacao/copom', false, 1000, 1000, 1000000, 2000, 0.02),

('bitcoin-acima-90k-abril-2026', 'Bitcoin vai ultrapassar $90.000 até 7 de abril?', 'BTC/USD no fechamento da semana', 'Cripto', 'binary', 'active', 0.38, 0.62, '2026-04-07T23:59:00Z', 'Bitcoin está em ~$84K após recuperação. ETFs institucionais têm acumulado posições.', 'Resolve SIM se BTC/USD atingir >= $90,000 em qualquer exchange major (Binance, Coinbase) até 07/04 23:59 UTC.', 'https://www.coingecko.com/en/coins/bitcoin', true, 1000, 1000, 1000000, 2000, 0.02),

('ethereum-acima-2000-abril-2026', 'ETH vai voltar acima de $2.000 esta semana?', 'Ethereum testando suporte em $1.800', 'Cripto', 'binary', 'active', 0.35, 0.65, '2026-04-06T23:59:00Z', 'Ethereum caiu 15% no último mês. Upgrade Dencun trouxe otimismo mas mercado segue cauteloso.', 'Resolve SIM se ETH/USD atingir >= $2,000 em qualquer exchange major até 06/04 23:59 UTC.', 'https://www.coingecko.com/en/coins/ethereum', false, 1000, 1000, 1000000, 2000, 0.02),

-- ============================================
-- FUTEBOL (próximos jogos)
-- ============================================

('flamengo-vence-vasco-carioca-2026', 'Flamengo vence o Vasco no clássico do Cariocão?', 'Jogo no Maracanã — quarta-feira', 'Futebol', 'binary', 'active', 0.62, 0.38, '2026-04-02T02:00:00Z', 'Flamengo líder do Cariocão com 6 vitórias em 8 jogos. Vasco vem de 2 derrotas seguidas. Histórico favorece Flamengo no Maracanã.', 'Resolve SIM se Flamengo vencer nos 90 minutos (sem prorrogação). Empate = NÃO.', 'https://ge.globo.com/', true, 1000, 1000, 1000000, 2000, 0.02),

('palmeiras-campea-paulistao-2026', 'Palmeiras vai ser campeão do Paulistão 2026?', 'Final prevista para segunda semana de abril', 'Futebol', 'binary', 'active', 0.55, 0.45, '2026-04-13T23:59:00Z', 'Palmeiras e São Paulo são os favoritos. Palmeiras eliminou Santos nas semis.', 'Resolve SIM se Palmeiras conquistar o título do Campeonato Paulista 2026.', 'https://ge.globo.com/', false, 1000, 1000, 1000000, 2000, 0.02),

('brasil-vence-argentina-eliminatorias', 'Brasil vence a Argentina nas Eliminatórias?', 'Jogo em Buenos Aires — 3 de abril', 'Futebol', 'binary', 'active', 0.28, 0.72, '2026-04-04T02:00:00Z', 'Brasil precisa de vitória para se manter na zona de classificação. Argentina lidera as Eliminatórias. Último confronto: empate 1-1.', 'Resolve SIM se a Seleção Brasileira vencer nos 90 minutos. Empate = NÃO.', 'https://ge.globo.com/', true, 1000, 1000, 1000000, 2000, 0.02),

-- ============================================
-- POLÍTICA (curto prazo)
-- ============================================

('lula-aprovacao-acima-35-abril', 'Aprovação de Lula estará acima de 35% na próxima pesquisa?', 'Datafolha previsto para primeira semana de abril', 'Política', 'binary', 'active', 0.48, 0.52, '2026-04-07T23:59:00Z', 'Última pesquisa Datafolha mostrou 33% de aprovação. Governo anunciou pacote econômico.', 'Resolve SIM se a próxima pesquisa Datafolha publicada até 07/04 mostrar aprovação >= 35%.', 'https://datafolha.folha.uol.com.br/', false, 1000, 1000, 1000000, 2000, 0.02),

('reforma-tributaria-regulamentada-abril', 'Regulamentação da reforma tributária será votada em abril?', 'Senado promete votar até final do mês', 'Política', 'binary', 'active', 0.40, 0.60, '2026-04-30T23:59:00Z', 'Reforma tributária aprovada em 2023. Regulamentação passou na Câmara. Senado tem prazo apertado.', 'Resolve SIM se o Senado votar a regulamentação da reforma tributária até 30/04/2026.', 'https://www.congressonacional.leg.br/', false, 1000, 1000, 1000000, 2000, 0.02),

-- ============================================
-- CULTURA POP / ENTRETENIMENTO
-- ============================================

('bbb-26-quem-sai-proximo-paredao', 'Quem será eliminado no próximo paredão do BBB 26?', 'Paredão de terça-feira', 'Cultura Pop', 'binary', 'active', 0.65, 0.35, '2026-04-01T03:00:00Z', 'Participantes no paredão: João vs Maria. João tem maior rejeição nas enquetes.', 'Resolve SIM se o primeiro participante listado (João) for eliminado. Resolve NÃO se Maria sair.', 'https://gshow.globo.com/realities/bbb/', true, 1000, 1000, 1000000, 2000, 0.02),

('oscar-melhor-filme-2026-anuncio', 'Emilia Pérez vai ganhar o Oscar de Melhor Filme?', 'Cerimônia em 2 de março (resultados já saíram)', 'Entretenimento', 'binary', 'active', 0.25, 0.75, '2026-04-01T23:59:00Z', 'Oscar 2026 já aconteceu. Este mercado é de verificação.', 'Resolve baseado no resultado oficial do Oscar 2026 de Melhor Filme.', 'https://www.oscars.org/', false, 1000, 1000, 1000000, 2000, 0.02),

-- ============================================
-- TECH / IA
-- ============================================

('apple-anuncia-ia-wwdc-2026', 'Apple vai anunciar novo modelo de IA na WWDC 2026?', 'WWDC prevista para junho, mas rumores de evento especial em abril', 'Tech / IA', 'binary', 'active', 0.58, 0.42, '2026-04-30T23:59:00Z', 'Apple está atrás na corrida de IA. Rumores de parceria com Google ou modelo próprio.', 'Resolve SIM se Apple anunciar oficialmente um novo modelo/serviço de IA (não atualização incremental) até 30/04/2026.', 'https://www.apple.com/', false, 1000, 1000, 1000000, 2000, 0.02),

('openai-gpt5-lancado-abril-2026', 'OpenAI vai lançar o GPT-5 em abril?', 'Rumores de lançamento iminente', 'Tech / IA', 'binary', 'active', 0.45, 0.55, '2026-04-30T23:59:00Z', 'GPT-4o lançado em maio 2024. Há 11 meses sem novo modelo flagship. Sam Altman disse "em breve".', 'Resolve SIM se OpenAI lançar oficialmente GPT-5 (ou equivalente flagship) para acesso público até 30/04/2026.', 'https://openai.com/', true, 1000, 1000, 1000000, 2000, 0.02),

-- ============================================
-- CLIMA
-- ============================================

('temperatura-sp-acima-35-semana', 'São Paulo vai ter temperatura acima de 35°C esta semana?', 'Onda de calor prevista', 'Clima', 'binary', 'active', 0.52, 0.48, '2026-04-06T23:59:00Z', 'Frente quente se aproximando do Sudeste. Previsão de temperaturas entre 32-37°C.', 'Resolve SIM se qualquer estação meteorológica oficial do INMET em São Paulo capital registrar >= 35°C até 06/04.', 'https://www.inmet.gov.br/', false, 1000, 1000, 1000000, 2000, 0.02),

('chuva-rio-alerta-vermelho-abril', 'Rio de Janeiro terá alerta vermelho de chuva em abril?', 'Temporada de chuvas no Sudeste', 'Clima', 'binary', 'active', 0.60, 0.55, '2026-04-30T23:59:00Z', 'Rio já teve 3 alertas vermelhos em 2026. Abril historicamente chuvoso.', 'Resolve SIM se a Defesa Civil do Rio emitir alerta vermelho (nível máximo) de chuvas em abril 2026.', 'https://alertario.rio.rj.gov.br/', false, 1000, 1000, 1000000, 2000, 0.02),

-- ============================================
-- MUNDO
-- ============================================

('trump-anuncia-tarifa-china-abril', 'Trump vai anunciar novas tarifas contra a China em abril?', 'Tensões comerciais escalando', 'Mundo', 'binary', 'active', 0.72, 0.28, '2026-04-30T23:59:00Z', 'Trump já impôs tarifas de 60% em diversos setores. China retaliou. Negociações estagnadas.', 'Resolve SIM se governo Trump anunciar oficialmente novas tarifas sobre produtos chineses em abril 2026.', 'https://www.reuters.com/', true, 1000, 1000, 1000000, 2000, 0.02),

('cessar-fogo-ucrania-abril-2026', 'Haverá cessar-fogo na Ucrânia em abril?', 'Negociações mediadas pela Turquia em andamento', 'Mundo', 'binary', 'active', 0.12, 0.88, '2026-04-30T23:59:00Z', 'Guerra completa 4 anos em fevereiro. Rússia controla ~18% do território. Negociações avançaram pouco.', 'Resolve SIM se Ucrânia e Rússia assinarem acordo formal de cessar-fogo (mesmo temporário) até 30/04/2026.', 'https://www.reuters.com/', false, 1000, 1000, 1000000, 2000, 0.02),

-- ============================================
-- ESPORTES (outros)
-- ============================================

('verstappen-vence-gp-japao-2026', 'Verstappen vence o GP do Japão 2026?', 'Corrida em Suzuka — 6 de abril', 'Esportes', 'binary', 'active', 0.48, 0.52, '2026-04-06T10:00:00Z', 'Verstappen lidera o campeonato mas Ferrari e McLaren estão competitivos. Suzuka favorece carros com boa aerodinâmica.', 'Resolve SIM se Max Verstappen vencer o GP do Japão 2026 (resultado oficial FIA).', 'https://www.formula1.com/', true, 1000, 1000, 1000000, 2000, 0.02),

('nba-playoffs-lakers-classificados', 'Lakers vão se classificar para os Playoffs da NBA 2026?', 'Temporada regular termina em 12 de abril', 'Esportes', 'binary', 'active', 0.55, 0.45, '2026-04-13T06:00:00Z', 'Lakers estão na 7ª posição do Oeste com record de 42-35. Precisam vencer play-in.', 'Resolve SIM se os Lakers se classificarem para os Playoffs da NBA 2025-26 (não apenas play-in).', 'https://www.nba.com/', false, 1000, 1000, 1000000, 2000, 0.02);
