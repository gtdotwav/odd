import type { Metadata } from "next";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "API & Documentação",
  description: "Documentação completa da API Odd. Endpoints públicos para mercados, preços, atividade e trading.",
};

const STATUS_COLORS: Record<string, string> = {
  live: "bg-up/15 text-up",
  soon: "bg-accent/15 text-accent",
  planned: "bg-surface-raised text-text-tertiary",
};

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: boolean;
  status: "live" | "soon" | "planned";
  params?: { name: string; type: string; required: boolean; description: string }[];
  response?: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-up/15 text-up",
  POST: "bg-accent/15 text-accent",
  PATCH: "bg-amber-500/15 text-amber-600",
  DELETE: "bg-down/15 text-down",
};

const sections: { title: string; description: string; icon: string; endpoints: Endpoint[] }[] = [
  {
    title: "Mercados",
    description: "Consulte mercados ativos, filtros, busca e detalhes completos.",
    icon: "bar-chart",
    endpoints: [
      {
        method: "GET",
        path: "/api/markets",
        description: "Lista mercados com filtros, ordenação, busca e paginação por cursor.",
        auth: false,
        status: "live",
        params: [
          { name: "category", type: "string", required: false, description: "Filtrar por categoria (Economia, Futebol, Política, etc.)" },
          { name: "status", type: "string", required: false, description: "Filtrar por status (active, live, closing, resolved_yes, resolved_no)" },
          { name: "tab", type: "string", required: false, description: "Filtro rápido (trending, new, popular, liquid, closing, disputed, brazil)" },
          { name: "sort", type: "string", required: false, description: "Ordenação: relevance (padrão), volume, variation, resolution, newest" },
          { name: "search", type: "string", required: false, description: "Busca por título ou subtítulo (case-insensitive)" },
          { name: "limit", type: "number", required: false, description: "Resultados por página (1-50, padrão 20)" },
          { name: "cursor", type: "string", required: false, description: "ID do último item para paginação" },
        ],
        response: `{
  "markets": [
    {
      "id": "uuid",
      "slug": "selic-sobe-maio-2026",
      "title": "Selic sobe na reunião do Copom?",
      "category": "Economia",
      "type": "binary",
      "status": "active",
      "priceYes": 0.78,
      "priceNo": 0.22,
      "variation24h": 0.032,
      "volume": 2100000,
      "commentCount": 84,
      "resolutionDate": "2026-05-07",
      "featured": true,
      "outcomes": [],
      "sport": null,
      "crypto": null
    }
  ],
  "total": 12,
  "hasMore": false
}`,
      },
      {
        method: "GET",
        path: "/api/markets/{slug}",
        description: "Retorna mercado completo por slug com outcomes, dados esportivos/crypto e histórico de preços.",
        auth: false,
        status: "live",
        params: [
          { name: "slug", type: "string", required: true, description: "Slug do mercado (path parameter)" },
        ],
        response: `{
  "id": "uuid",
  "slug": "selic-sobe-maio-2026",
  "title": "Selic sobe na reunião do Copom?",
  "priceYes": 0.78,
  "priceNo": 0.22,
  "context": "Análise detalhada...",
  "rules": "Regras de resolução...",
  "source": "Banco Central do Brasil",
  "priceHistory": [
    {
      "priceYes": 0.77,
      "priceNo": 0.23,
      "volumeDelta": 33267,
      "recordedAt": "2026-03-26T12:00:00Z"
    }
  ]
}`,
      },
      {
        method: "GET",
        path: "/api/markets/{slug}/prices",
        description: "Histórico de preços com filtro por período. Suporta intervalos de 1h a todo o histórico.",
        auth: false,
        status: "soon",
        params: [
          { name: "slug", type: "string", required: true, description: "Slug do mercado" },
          { name: "period", type: "string", required: false, description: "Período: 1h, 6h, 24h, 7d, 30d, all (padrão: 7d)" },
          { name: "fidelity", type: "number", required: false, description: "Intervalo em minutos entre pontos (padrão: auto)" },
        ],
      },
      {
        method: "GET",
        path: "/api/markets/{slug}/activity",
        description: "Feed de atividade recente do mercado (compras, vendas, volume).",
        auth: false,
        status: "soon",
      },
    ],
  },
  {
    title: "Ordens & Trading",
    description: "Crie, consulte e cancele ordens de compra e venda.",
    icon: "zap",
    endpoints: [
      {
        method: "POST",
        path: "/api/orders",
        description: "Cria uma nova ordem de compra ou venda. Suporta ordens market e limit.",
        auth: true,
        status: "planned",
        params: [
          { name: "market_id", type: "uuid", required: true, description: "ID do mercado" },
          { name: "outcome_id", type: "uuid", required: false, description: "ID do outcome (para mercados multi-opção)" },
          { name: "side", type: "string", required: true, description: "Lado da operação: yes ou no" },
          { name: "type", type: "string", required: true, description: "Tipo: market ou limit" },
          { name: "price", type: "number", required: true, description: "Preço (0.01 a 0.99)" },
          { name: "quantity", type: "number", required: true, description: "Quantidade de contratos (mínimo 1)" },
        ],
      },
      {
        method: "GET",
        path: "/api/orders",
        description: "Lista ordens do usuário autenticado com filtros por status e mercado.",
        auth: true,
        status: "planned",
      },
      {
        method: "GET",
        path: "/api/orders/{id}",
        description: "Detalhes de uma ordem específica.",
        auth: true,
        status: "planned",
      },
      {
        method: "DELETE",
        path: "/api/orders/{id}",
        description: "Cancela uma ordem pendente.",
        auth: true,
        status: "planned",
      },
    ],
  },
  {
    title: "Carteira & Pagamentos",
    description: "Consulte saldo, faça depósitos e saques via Pix.",
    icon: "shield",
    endpoints: [
      {
        method: "GET",
        path: "/api/wallet",
        description: "Retorna saldo e histórico resumido da carteira do usuário.",
        auth: true,
        status: "planned",
      },
      {
        method: "POST",
        path: "/api/wallet/deposit",
        description: "Inicia depósito via Pix. Retorna QR code e código copia-e-cola.",
        auth: true,
        status: "planned",
        params: [
          { name: "amount", type: "number", required: true, description: "Valor em R$ (mínimo 5, máximo 50.000)" },
        ],
      },
      {
        method: "POST",
        path: "/api/wallet/withdraw",
        description: "Solicita saque via Pix para chave cadastrada.",
        auth: true,
        status: "planned",
        params: [
          { name: "amount", type: "number", required: true, description: "Valor em R$ (mínimo 10, máximo 50.000)" },
          { name: "pix_key", type: "string", required: true, description: "Chave Pix de destino" },
        ],
      },
      {
        method: "GET",
        path: "/api/wallet/transactions",
        description: "Histórico completo de transações (depósitos, saques, trades, taxas).",
        auth: true,
        status: "planned",
      },
    ],
  },
  {
    title: "Portfólio & Posições",
    description: "Visualize posições abertas, fechadas e métricas de performance.",
    icon: "trend-up",
    endpoints: [
      {
        method: "GET",
        path: "/api/portfolio",
        description: "Posições abertas do usuário com PnL e valor atual.",
        auth: true,
        status: "planned",
      },
      {
        method: "GET",
        path: "/api/portfolio/closed",
        description: "Histórico de posições encerradas.",
        auth: true,
        status: "planned",
      },
      {
        method: "GET",
        path: "/api/portfolio/performance",
        description: "Métricas de performance: PnL total, win rate, ROI, volume negociado.",
        auth: true,
        status: "planned",
      },
    ],
  },
  {
    title: "Comentários",
    description: "Discussões em mercados. Leitura pública, escrita autenticada.",
    icon: "building",
    endpoints: [
      {
        method: "GET",
        path: "/api/comments",
        description: "Lista comentários de um mercado, ordenados por relevância ou data.",
        auth: false,
        status: "soon",
        params: [
          { name: "market_id", type: "uuid", required: true, description: "ID do mercado" },
          { name: "sort", type: "string", required: false, description: "Ordenação: relevant (padrão), recent" },
          { name: "limit", type: "number", required: false, description: "Limite (padrão 20, máximo 50)" },
        ],
      },
      {
        method: "POST",
        path: "/api/comments",
        description: "Publica um novo comentário em um mercado.",
        auth: true,
        status: "soon",
        params: [
          { name: "market_id", type: "uuid", required: true, description: "ID do mercado" },
          { name: "text", type: "string", required: true, description: "Texto do comentário (1-2000 caracteres)" },
        ],
      },
      {
        method: "POST",
        path: "/api/comments/{id}/like",
        description: "Curte ou descurte um comentário (toggle).",
        auth: true,
        status: "planned",
      },
    ],
  },
  {
    title: "Watchlist & Notificações",
    description: "Gerencie mercados salvos e preferências de notificação.",
    icon: "star",
    endpoints: [
      {
        method: "GET",
        path: "/api/watchlist",
        description: "Lista mercados salvos pelo usuário.",
        auth: true,
        status: "planned",
      },
      {
        method: "POST",
        path: "/api/watchlist/{market_id}",
        description: "Adiciona mercado à watchlist.",
        auth: true,
        status: "planned",
      },
      {
        method: "DELETE",
        path: "/api/watchlist/{market_id}",
        description: "Remove mercado da watchlist.",
        auth: true,
        status: "planned",
      },
      {
        method: "GET",
        path: "/api/notifications",
        description: "Lista notificações do usuário (trades, resoluções, alertas).",
        auth: true,
        status: "planned",
      },
      {
        method: "PATCH",
        path: "/api/notifications/{id}",
        description: "Marca notificação como lida.",
        auth: true,
        status: "planned",
      },
    ],
  },
  {
    title: "Usuários & Social",
    description: "Perfis públicos, rankings e sistema de follows.",
    icon: "globe",
    endpoints: [
      {
        method: "GET",
        path: "/api/users/{handle}",
        description: "Perfil público de um usuário com estatísticas de trading.",
        auth: false,
        status: "planned",
      },
      {
        method: "GET",
        path: "/api/leaderboard",
        description: "Ranking de traders por PnL ou volume, filtrável por categoria e período.",
        auth: false,
        status: "planned",
        params: [
          { name: "metric", type: "string", required: false, description: "Métrica: pnl (padrão) ou volume" },
          { name: "period", type: "string", required: false, description: "Período: 24h, 7d, 30d, all" },
          { name: "category", type: "string", required: false, description: "Filtrar por categoria" },
          { name: "limit", type: "number", required: false, description: "Limite (padrão 50)" },
        ],
      },
      {
        method: "POST",
        path: "/api/users/{handle}/follow",
        description: "Segue ou deixa de seguir um usuário (toggle).",
        auth: true,
        status: "planned",
      },
      {
        method: "GET",
        path: "/api/search",
        description: "Busca unificada em mercados, usuários e categorias.",
        auth: false,
        status: "planned",
        params: [
          { name: "q", type: "string", required: true, description: "Termo de busca (mínimo 2 caracteres)" },
          { name: "type", type: "string", required: false, description: "Tipo: markets, users, all (padrão: all)" },
        ],
      },
    ],
  },
];

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface">
        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-text flex-1">{endpoint.path}</code>
        <div className="flex items-center gap-2">
          {endpoint.auth && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
              <Icon name="shield" className="w-3 h-3" />
              Auth
            </span>
          )}
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_COLORS[endpoint.status]}`}>
            {endpoint.status === "live" ? "Ativo" : endpoint.status === "soon" ? "Em breve" : "Planejado"}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-text-secondary">{endpoint.description}</p>

        {/* Parameters */}
        {endpoint.params && endpoint.params.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Parâmetros</h4>
            <div className="space-y-1.5">
              {endpoint.params.map((p) => (
                <div key={p.name} className="flex items-baseline gap-2 text-xs">
                  <code className="font-mono text-accent">{p.name}</code>
                  <span className="text-text-tertiary">{p.type}</span>
                  {p.required && <span className="text-down text-[10px]">obrigatório</span>}
                  <span className="text-text-secondary flex-1">{p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response */}
        {endpoint.response && (
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Resposta</h4>
            <pre className="bg-surface-raised rounded-md p-3 overflow-x-auto text-xs font-mono text-text-secondary leading-relaxed">
              {endpoint.response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocsPage() {
  const totalEndpoints = sections.reduce((sum, s) => sum + s.endpoints.length, 0);
  const liveCount = sections.reduce((sum, s) => sum + s.endpoints.filter((e) => e.status === "live").length, 0);
  const soonCount = sections.reduce((sum, s) => sum + s.endpoints.filter((e) => e.status === "soon").length, 0);
  const plannedCount = totalEndpoints - liveCount - soonCount;

  return (
    <div className="max-w-[960px] mx-auto px-4 md:px-8 py-8">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">v0.1.0</span>
          <span className="text-xs text-text-tertiary">REST API</span>
        </div>
        <h1 className="text-3xl font-bold text-text mb-3">API Odd</h1>
        <p className="text-text-secondary max-w-2xl leading-relaxed">
          API pública para acessar mercados de previsão, preços, atividade e dados em tempo real da plataforma Odd.
          Endpoints de leitura são públicos. Endpoints de escrita (ordens, comentários, watchlist) requerem autenticação.
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-8 p-4 rounded-lg border border-border bg-surface">
        <h2 className="text-sm font-semibold mb-2">Base URL</h2>
        <code className="text-sm font-mono text-accent">https://odd.com.br/api</code>
        <p className="text-xs text-text-tertiary mt-1">Todas as respostas são JSON. UTF-8. Datas em ISO 8601.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="p-3 rounded-lg border border-border bg-surface text-center">
          <p className="text-2xl font-mono font-bold text-text">{totalEndpoints}</p>
          <p className="text-xs text-text-tertiary">Endpoints</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-surface text-center">
          <p className="text-2xl font-mono font-bold text-up">{liveCount}</p>
          <p className="text-xs text-text-tertiary">Ativos</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-surface text-center">
          <p className="text-2xl font-mono font-bold text-accent">{soonCount + plannedCount}</p>
          <p className="text-xs text-text-tertiary">Em desenvolvimento</p>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mb-10 p-4 rounded-lg border border-border bg-surface">
        <h2 className="text-sm font-semibold mb-3">Referência rápida</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          {sections.flatMap((s) =>
            s.endpoints.map((e) => (
              <div key={e.path + e.method} className="flex items-center gap-2 py-1 text-xs">
                <span className={`w-12 text-center px-1 py-0.5 rounded text-[10px] font-mono font-bold ${METHOD_COLORS[e.method]}`}>
                  {e.method}
                </span>
                <code className="font-mono text-text-secondary flex-1 truncate">{e.path}</code>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[e.status]}`}>
                  {e.status === "live" ? "Ativo" : e.status === "soon" ? "Breve" : "Plan."}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Authentication */}
      <div className="mb-10 p-4 rounded-lg border border-border bg-surface">
        <h2 className="text-sm font-semibold mb-2">Autenticação</h2>
        <p className="text-sm text-text-secondary mb-3">
          Endpoints marcados com <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded"><Icon name="shield" className="w-3 h-3" />Auth</span> requerem token JWT no header:
        </p>
        <pre className="bg-surface-raised rounded-md p-3 text-xs font-mono text-text-secondary">
{`Authorization: Bearer <token>

# Obtenha seu token via login:
POST /api/auth/token
Content-Type: application/json

{ "provider": "clerk" }`}
        </pre>
        <p className="text-xs text-text-tertiary mt-2">
          Rate limit: 100 req/min (leitura), 30 req/min (escrita). Headers X-RateLimit-* informam consumo.
        </p>
      </div>

      {/* Data Model */}
      <div className="mb-10 p-4 rounded-lg border border-border bg-surface">
        <h2 className="text-sm font-semibold mb-3">Modelo de dados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <h3 className="font-semibold text-text mb-1">Market</h3>
            <p className="text-text-secondary mb-2">Pergunta binária ou multi-opção com preço, volume e probabilidades.</p>
            <ul className="space-y-0.5 text-text-tertiary font-mono">
              <li>id, slug, title</li>
              <li>type: binary | multi | sport | crypto</li>
              <li>priceYes, priceNo (0.01-0.99)</li>
              <li>volume, variation24h</li>
              <li>resolutionDate, status</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-1">Outcome</h3>
            <p className="text-text-secondary mb-2">Opção dentro de um mercado multi-opção (ex: candidatos).</p>
            <ul className="space-y-0.5 text-text-tertiary font-mono">
              <li>id, label</li>
              <li>probability (0.00-1.00)</li>
              <li>Vinculado a market_id</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-1">Order</h3>
            <p className="text-text-secondary mb-2">Ordem de compra ou venda, market ou limit.</p>
            <ul className="space-y-0.5 text-text-tertiary font-mono">
              <li>side: yes | no</li>
              <li>type: market | limit</li>
              <li>price, quantity</li>
              <li>status: pending → filled</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Concepts */}
      <div className="mb-10 p-4 rounded-lg border border-border bg-surface">
        <h2 className="text-sm font-semibold mb-3">Conceitos</h2>
        <div className="space-y-3 text-sm text-text-secondary">
          <div>
            <h3 className="font-medium text-text">Preço = Probabilidade</h3>
            <p>R$ 0,78 = 78% de probabilidade. Contratos resolvem a R$ 1,00 (correto) ou R$ 0,00 (incorreto).</p>
          </div>
          <div>
            <h3 className="font-medium text-text">Mercado binário vs Multi-opção</h3>
            <p>Mercados binários têm Sim/Não com preços complementares. Multi-opção tem N outcomes onde as probabilidades somam 100%.</p>
          </div>
          <div>
            <h3 className="font-medium text-text">Taxa de operação</h3>
            <p>2% sobre o valor da operação. A taxa é proporcional à incerteza — menor nos extremos de probabilidade.</p>
          </div>
          <div>
            <h3 className="font-medium text-text">Resolução</h3>
            <p>Mercados são resolvidos com base em fontes oficiais definidas nas regras. Período de contestação de 48h após resolução.</p>
          </div>
        </div>
      </div>

      {/* Endpoint Sections */}
      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.title} id={section.title.toLowerCase().replace(/[^a-z]/g, "-")}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name={section.icon} className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-text">{section.title}</h2>
            </div>
            <p className="text-sm text-text-secondary mb-4">{section.description}</p>

            <div className="space-y-4">
              {section.endpoints.map((e) => (
                <EndpointCard key={e.method + e.path} endpoint={e} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* WebSocket */}
      <section className="mt-10 p-4 rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="zap" className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-text">WebSocket (em breve)</h2>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Conexão em tempo real para preços, atividade e scores esportivos.
        </p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-3 p-2 rounded bg-surface-raised">
            <code className="font-mono text-accent">wss://odd.com.br/ws/market</code>
            <span className="text-text-tertiary">Preços ao vivo, order book, resoluções</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded bg-surface-raised">
            <code className="font-mono text-accent">wss://odd.com.br/ws/user</code>
            <span className="text-text-tertiary">Ordens, trades, notificações (auth)</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded bg-surface-raised">
            <code className="font-mono text-accent">wss://odd.com.br/ws/sports</code>
            <span className="text-text-tertiary">Scores ao vivo, estado de jogos</span>
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="mt-10 p-4 rounded-lg border border-border bg-surface">
        <h2 className="text-sm font-semibold mb-3">SDKs & Integrações (planejado)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded bg-surface-raised">
            <p className="font-semibold text-text mb-1">TypeScript / JavaScript</p>
            <code className="font-mono text-text-tertiary">npm install @odd/client</code>
          </div>
          <div className="p-3 rounded bg-surface-raised">
            <p className="font-semibold text-text mb-1">Python</p>
            <code className="font-mono text-text-tertiary">pip install odd-client</code>
          </div>
          <div className="p-3 rounded bg-surface-raised">
            <p className="font-semibold text-text mb-1">OpenAPI Spec</p>
            <code className="font-mono text-text-tertiary">odd.com.br/api/openapi.yaml</code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-border text-center text-xs text-text-tertiary">
        <p>Odd API v0.1.0 — Documentação atualizada em março 2026</p>
      </div>
    </div>
  );
}
