# Controle Financeiro de Casamento

Aplicação web para gerenciar o orçamento, despesas, parcelas, fornecedores e checklist financeiro de um casamento. Interface 100% em português (pt-BR).

## Stack

- **Next.js 16 (App Router)** + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** via `pg` (node-postgres), com pool de conexões reutilizado entre invocações — tabelas migradas automaticamente (`CREATE TABLE IF NOT EXISTS`) na primeira conexão, sem passo manual
- **NextAuth.js** (Credentials Provider) com **bcrypt** para autenticação multiusuário — cada usuário só enxerga seu(s) próprio(s) casamento(s)
- **Recharts** para gráficos
- **date-fns** com locale pt-BR para datas
- Todo valor monetário é armazenado como **inteiro em centavos** (evita erros de ponto flutuante) e formatado como `R$ 1.250,00` na interface. Datas são armazenadas em ISO e exibidas como `dd/mm/aaaa`.

## Como rodar

É necessário um banco **PostgreSQL** — não usamos mais SQLite. Defina a variável de ambiente `POSTGRES_URL` apontando para qualquer instância Postgres, por exemplo:

- um container local: `docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine` → `POSTGRES_URL=postgres://postgres:postgres@localhost:5432/postgres`
- um projeto gratuito no [Supabase](https://supabase.com) ou no [Neon](https://neon.tech) (ambos fornecem uma connection string pronta)

```bash
export POSTGRES_URL="postgres://postgres:postgres@localhost:5432/postgres"
npm install
npm run seed   # cria usuário e casamento de demonstração (idempotente)
npm run dev    # http://localhost:3000
```

Login de demonstração (criado pelo seed):

- **E-mail:** `joao.maria@exemplo.com`
- **Senha:** `casamento123`

Para produção:

```bash
npm run build
npm run start
```

As tabelas são criadas automaticamente (`CREATE TABLE IF NOT EXISTS`) na primeira conexão ao banco — não há passo de migração manual. Em produção na Vercel, conecte um banco Postgres (ex.: Supabase) pela aba **Storage** do projeto: isso injeta `POSTGRES_URL` (ou variáveis equivalentes) automaticamente. Arquivos de comprovante enviados ainda ficam em disco local (`uploads/`, ou `/tmp/wedding-finance/uploads` na Vercel) — isso é efêmero em serverless e é um problema separado, fora do escopo desta migração.

## Testes

```bash
npm run test
```

17 testes unitários (Vitest) cobrem a geração de parcelas (`lib/finance/installments.ts`) e o cálculo de status de parcela (`lib/finance/status.ts`) — as partes mais sensíveis a bugs de arredondamento e regras de negócio.

## Arquitetura

- `app/` — rotas (App Router). `app/(app)/` agrupa todas as páginas autenticadas sob o layout com sidebar/bottom-nav; `app/api/` contém as rotas de API (CRUD, exportações, backup).
- `components/` — componentes de UI reutilizáveis, organizados por funcionalidade.
- `lib/db/` — camada de acesso ao PostgreSQL: `index.ts` cria o pool de conexões e migra o schema, `repo.ts` contém todas as funções de leitura/escrita (assíncronas) usadas pelas rotas e páginas (sempre filtradas por `wedding_id` do usuário autenticado).
- `lib/finance/` — funções puras (sem I/O, testáveis) de cálculo financeiro: geração de parcelas com arredondamento exato (`installments.ts`), cálculo automático de status (`status.ts`), agregações de totais (`totals.ts`), formatação monetária (`money.ts`) e constantes de domínio (`constants.ts`).
- `lib/auth/` — configuração do NextAuth e helper `requireUserAndWedding()` usado em toda página/rota protegida.
- `lib/reports/` — geração de CSV.
- `scripts/seed.ts` — popula o banco com usuário, casamento e dados de demonstração (marcados com `is_demo = 1`, removíveis em Configurações).

## Funcionalidades implementadas

- **Autenticação completa**: login, logout, rotas protegidas, sessão via cookie (JWT).
- **Dashboard**: cards (valor total, pago, a pagar, vencido, próximos 30 dias, saldo disponível, % comprometido/pago/pendente), gráfico de pizza por categoria, gráfico de evolução mensal (pago x pendente), banner de alertas (vencendo hoje / 7 dias / vencidos) e feed de atividade recente.
- **Orçamento**: nome dos noivos, data do casamento, orçamento máximo, observações, orçamento por categoria (opcional) com % já comprometido.
- **Despesas**: CRUD completo — nome, categoria (lista + personalizada), fornecedor, descrição, data de contratação, valor total, observações. Tipos de pagamento: à vista, parcelado, entrada + parcelas, recorrente, a combinar. Geração automática de parcelas com periodicidade mensal/quinzenal/semanal/personalizada, entrada deduzida do saldo antes do parcelamento, e arredondamento sempre ajustado na última parcela (soma == valor total, sempre).
- **Parcelas**: status calculado automaticamente (Pendente/Pago/Vencido/Parcialmente pago/Cancelado) a partir da data de vencimento e dos pagamentos reais — nunca um flag manual. Suporta múltiplos pagamentos parciais por parcela.
- **Registrar pagamento**: modal com valor, data, forma de pagamento, conta/cartão, observação e upload de comprovante (salvo em `uploads/`, servido via rota autenticada).
- **Cartão de crédito**: despesas podem registrar cartão utilizado e data da primeira fatura.
- **Fornecedores**: CRUD completo, página de detalhe com valores contratado/pago/pendente calculados e lista de despesas/parcelas vinculadas.
- **Calendário**: visão mensal com contagem e valor total por dia; clique no dia mostra as parcelas.
- **Pagamentos**: listagem completa com filtros (forma de pagamento, mês, busca por despesa) e exportação CSV.
- **Alertas**: banner no dashboard com totais em linguagem natural.
- **Relatórios**: gastos por categoria, ranking de gastos por fornecedor, pagamentos por mês, resumo mensal (previsto/pago/pendente/vencido) e projeção de fluxo de caixa acumulado até a data do casamento. Alerta visual quando uma categoria ultrapassa o orçamento definido.
- **Checklist**: tarefas financeiras com prazo, responsável, status e observação; marcação rápida de concluído.
- **Busca global**: página `/busca` pesquisando fornecedores, despesas e parcelas.
- **Edição/exclusão**: em todas as entidades, com diálogo de confirmação; exclusão de despesa avisa quantas parcelas/pagamentos serão removidos junto.
- **Histórico**: log de auditoria (criado/editado/pago/cancelado/excluído) exibido no dashboard (recente) e em `/historico` (completo).
- **Exportação CSV**: pagamentos, parcelas e fornecedores — geração real, não é mock.
- **Backup**: exportação completa do banco como JSON (download) e restauração a partir de um arquivo JSON.
- **Regras de negócio**: soma de parcelas sempre igual ao valor contratado (resto de arredondamento na última parcela); entrada deduzida automaticamente; pagamentos parciais recalculam o saldo automaticamente; pagar antes do vencimento mantém a data de vencimento original; parcelas vencidas aparecem destacadas em vermelho; status "Pago" exige pagamento real registrado.
- **Responsividade mobile-first**: sidebar fixa no desktop; no mobile, barra inferior de navegação + botão flutuante "+" com atalhos (Nova despesa / Novo fornecedor / Registrar pagamento / Nova tarefa) + menu lateral deslizante; tabelas viram cards empilhados abaixo do breakpoint `md`; sem scroll horizontal.

## O que está simplificado / não implementado

- **Exportação em PDF e Excel**: não implementada nesta versão — os botões existem em Configurações mas indicam claramente "em breve". A exportação em **CSV está totalmente funcional** para pagamentos, parcelas e fornecedores.
- **Multi-casamento por usuário**: o modelo de dados suporta múltiplos casamentos por usuário (`weddings.user_id`), mas a interface sempre usa o primeiro casamento do usuário (criado automaticamente no primeiro acesso) — não há troca de casamento na UI.
- **"Pagamentos por mês" em Relatórios**: por simplicidade, agrupa pelo mês de **vencimento** da parcela (não pela data exata de cada pagamento parcial), já que uma parcela pode ter vários pagamentos em datas diferentes. O "Resumo mensal" segue a mesma lógica de vencimento.
- **Busca global**: implementada como página dedicada (`/busca`), não como modal com atalho de teclado.

## Modelo de dados

SQLite com as tabelas: `users`, `weddings`, `categoria_orcamentos`, `fornecedores`, `despesas`, `parcelas`, `pagamentos`, `checklist`, `historico`. Todas as tabelas de dados do casamento são vinculadas por `wedding_id`, e toda rota de API filtra pela sessão do usuário autenticado — um usuário nunca acessa dados de outro.
