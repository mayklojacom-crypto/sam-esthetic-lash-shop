

# Painel Administrativo — Sam Esthetic

## Resumo
Criar um painel admin completo estilo Shopify, protegido por login/senha, acessível apenas por URL oculta (`/admin`). O painel permitirá gerenciar pedidos, atualizar status, adicionar código de rastreio e ver métricas de acesso.

## Estrutura do Painel

### 1. Autenticação Admin
- Tabela `admin_users` no banco com email e senha (hash via bcrypt na edge function)
- Página `/admin/login` com formulário de email + senha
- Edge function `admin-auth` para validar credenciais e retornar token JWT
- Proteção de todas as rotas `/admin/*` — redireciona para login se não autenticado
- O link `/admin` NÃO aparece em nenhum menu do site (acesso apenas por URL direta)

### 2. Banco de Dados (Migrações)
- **Tabela `admin_users`**: id, email, password_hash, created_at
- **Coluna `tracking_code`** na tabela `orders`: código de rastreio
- **Coluna `order_status`** na tabela `orders`: enum (novo, processando, enviado, entregue, cancelado)
- **Tabela `daily_visits`**: date, visit_count (para contabilizar acessos diários)
- RLS nas tabelas admin (acesso apenas via service role key nas edge functions)

### 3. Edge Functions
- **`admin-auth`**: Login do admin, valida email/senha, retorna session token
- **`admin-orders`**: CRUD de pedidos (listar, atualizar status, adicionar rastreio) — protegida por token
- **`track-visit`**: Registra visita diária (chamada do frontend público)

### 4. Páginas do Painel

**`/admin/login`** — Tela de login minimalista

**`/admin`** (Dashboard) — Visão geral estilo Shopify:
- Cards: Total de pedidos, Pedidos hoje, Receita total, Visitas hoje
- Gráfico simples de pedidos dos últimos 7 dias
- Lista dos últimos pedidos

**`/admin/pedidos`** — Lista de pedidos:
- Tabela com: Nº pedido, Cliente, Telefone, Total, Status, Data
- Filtros por status (Novo, Processando, Enviado, Entregue)
- Busca por nome/telefone/referência

**`/admin/pedidos/:id`** — Detalhe do pedido:
- Dados do cliente (nome, CPF, telefone, endereço)
- Itens do pedido
- Status com dropdown para alterar (Novo → Processando → Enviado → Entregue)
- Campo para inserir código de rastreio
- Botão para enviar mensagem no WhatsApp do cliente
- Link para PDF do pedido

### 5. Contabilização de Acessos
- No `Index.tsx` (página inicial), chamar a edge function `track-visit` uma vez por sessão
- Dashboard admin mostra visitas diárias dos últimos 30 dias

## Arquivos a Criar/Editar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/...` | Nova migração (admin_users, tracking_code, order_status, daily_visits) |
| `supabase/functions/admin-auth/index.ts` | Edge function de autenticação admin |
| `supabase/functions/admin-orders/index.ts` | Edge function CRUD pedidos |
| `supabase/functions/track-visit/index.ts` | Edge function registrar visita |
| `src/pages/admin/AdminLogin.tsx` | Página de login |
| `src/pages/admin/AdminDashboard.tsx` | Dashboard principal |
| `src/pages/admin/AdminOrders.tsx` | Lista de pedidos |
| `src/pages/admin/AdminOrderDetail.tsx` | Detalhe do pedido |
| `src/contexts/AdminAuthContext.tsx` | Context de autenticação admin |
| `src/components/admin/AdminLayout.tsx` | Layout com sidebar |
| `src/components/admin/AdminSidebar.tsx` | Sidebar navegação |
| `src/App.tsx` | Adicionar rotas /admin/* |
| `src/pages/Index.tsx` | Adicionar tracking de visitas |

## Detalhes Técnicos

- Senha do admin será armazenada com hash bcrypt via edge function
- Token de sessão admin armazenado no localStorage (JWT simples gerado na edge function)
- As edge functions admin validam o token em cada request
- O painel usa cores neutras/escuras diferente do site público (visual profissional)
- Sidebar com ícones: Dashboard, Pedidos, Configurações
- Tabelas responsivas com shadcn/ui Table component
- Status do pedido com badges coloridas (verde=entregue, amarelo=processando, azul=enviado, vermelho=cancelado)

