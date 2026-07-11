# Dashboard organizado com filtro de período e visitantes ao vivo

## O que vai mudar

### 1. Filtro de período no Dashboard
Adicionar um seletor no topo do dashboard para controlar o intervalo dos gráficos e cards:

- **Hoje**
- **Últimos 7 dias** (padrão atual)
- **Últimos 14 dias**
- **Últimos 30 dias**
- **Personalizado** (escolher data inicial e final via calendário)

Ao trocar o período, TODOS os dados reagem:
- Cards de "Total de Vendas", "Total de Pedidos" passam a refletir o período selecionado (com comparação vs período anterior — ex: "+12% vs período anterior")
- Gráfico de Pedidos mostra o intervalo escolhido
- Gráfico de Visitas mostra o intervalo escolhido (não mais fixo em 14 dias)
- "Últimos Pedidos" continua mostrando os 5 mais recentes (independente do filtro)

### 2. Visitantes ao vivo
Novo card em destaque no topo do dashboard mostrando **quantas pessoas estão no site AGORA** (últimos 2 minutos de atividade), com um indicador verde pulsante.

Detalhes:
- O site já rastreia visitas diárias. Vou estender para rastrear "presença" em tempo real via heartbeat: cada visitante envia um ping a cada 30s enquanto está com a aba aberta.
- O dashboard atualiza esse número automaticamente a cada 15 segundos.
- Mostra também "pico de hoje" (maior número simultâneo registrado no dia).

### 3. Organização visual
- Reorganizar o topo: **linha 1** = filtro de período + card de visitantes ao vivo em destaque.
- **Linha 2** = os 4 cards de estatísticas (agora com variação % vs período anterior).
- **Linha 3** = gráficos (pedidos + visitas).
- **Linha 4** = últimos pedidos.

Tudo mantendo o visual atual (cards brancos, sombras suaves, cores existentes).

## Detalhes técnicos

**Backend (Lovable Cloud):**
- Nova tabela `live_visitors` com colunas: `session_id` (uuid), `last_seen` (timestamptz), `created_at`. RLS pública para insert/update via edge function.
- Edge function `track-visit` estendida para aceitar `session_id` e atualizar `last_seen` (upsert). Continua incrementando `daily_visits` só no primeiro ping da sessão no dia.
- Nova edge function `live-visitors-count` (pública) que retorna: `{ online: N, peakToday: M }` — contando sessões com `last_seen > now() - 2min`.
- Edge function `admin-orders?action=dashboard` recebe parâmetros `from` e `to` (ISO date) e retorna:
  - `totalRevenue`, `totalOrders` no período + variação % vs período anterior de mesmo tamanho
  - `ordersByDay` e `visitsByDay` no intervalo escolhido
  - `latestOrders` (sempre os 5 mais recentes, sem filtro)

**Frontend:**
- `src/pages/admin/AdminDashboard.tsx`: adicionar estado `period` (preset ou custom range), seletor no topo (Shadcn Select + Calendar/DateRangePicker para custom), refetch quando muda.
- Novo componente `src/components/admin/LiveVisitorsCard.tsx` — faz polling a cada 15s na função `live-visitors-count`.
- Novo hook `src/hooks/useVisitorHeartbeat.ts` — usado em `App.tsx` ou `Index.tsx` para pingar a cada 30s enquanto a aba está ativa (pausa se `document.hidden`). Gera/persiste `session_id` em `sessionStorage`.

**Arquivos a criar/editar:**
- Migração: criar tabela `live_visitors` com GRANTs e RLS
- `supabase/functions/track-visit/index.ts` (editar — aceitar session_id + upsert)
- `supabase/functions/live-visitors-count/index.ts` (novo)
- `supabase/functions/admin-orders/index.ts` (editar dashboard action com from/to + comparação)
- `src/hooks/useVisitorHeartbeat.ts` (novo)
- `src/components/admin/LiveVisitorsCard.tsx` (novo)
- `src/pages/admin/AdminDashboard.tsx` (editar — filtro + reorganizar)
- `src/App.tsx` (editar — plugar o heartbeat globalmente)

## Fora deste escopo
- Ver **quem** está online (páginas específicas, cidades, etc.) — só o número agregado. Se quiser detalhes por página depois, faço numa segunda etapa.
