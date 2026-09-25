import { randomUUID } from "crypto";
import { getDb, logHistorico } from "@/lib/db";
import {
  generateInstallments,
  type Periodicidade,
} from "@/lib/finance/installments";
import { computeParcela } from "@/lib/finance/totals";

export interface Wedding {
  id: string;
  user_id: string;
  noivo1: string;
  noivo2: string;
  data_casamento: string | null;
  orcamento_maximo_cents: number;
  observacoes: string;
  is_demo: number;
}

/** Returns the user's primary wedding, creating a blank one if none exists. */
export function getOrCreateWedding(userId: string): Wedding {
  const db = getDb();
  let wedding = db
    .prepare("SELECT * FROM weddings WHERE user_id = ? ORDER BY created_at ASC LIMIT 1")
    .get(userId) as Wedding | undefined;
  if (!wedding) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO weddings (id, user_id, noivo1, noivo2, orcamento_maximo_cents, observacoes) VALUES (?,?,?,?,?,?)`
    ).run(id, userId, "", "", 0, "");
    wedding = db.prepare("SELECT * FROM weddings WHERE id = ?").get(id) as Wedding;
  }
  return wedding;
}

export function updateWedding(
  id: string,
  data: Partial<Pick<Wedding, "noivo1" | "noivo2" | "data_casamento" | "orcamento_maximo_cents" | "observacoes">>
) {
  const db = getDb();
  const current = db.prepare("SELECT * FROM weddings WHERE id = ?").get(id) as Wedding;
  const merged = { ...current, ...data };
  db.prepare(
    `UPDATE weddings SET noivo1=?, noivo2=?, data_casamento=?, orcamento_maximo_cents=?, observacoes=? WHERE id=?`
  ).run(
    merged.noivo1,
    merged.noivo2,
    merged.data_casamento,
    merged.orcamento_maximo_cents,
    merged.observacoes,
    id
  );
  logHistorico(id, "updated", "orcamento", id, "Orçamento/dados do casamento atualizados");
}

// ---------- Fornecedores ----------
export interface FornecedorRow {
  id: string;
  wedding_id: string;
  nome: string;
  categoria: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  observacoes: string;
  is_demo: number;
}

export function listFornecedores(weddingId: string): FornecedorRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM fornecedores WHERE wedding_id = ? ORDER BY nome ASC")
    .all(weddingId) as FornecedorRow[];
}

export function getFornecedor(weddingId: string, id: string): FornecedorRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM fornecedores WHERE wedding_id = ? AND id = ?")
    .get(weddingId, id) as FornecedorRow | undefined;
}

export function createFornecedor(weddingId: string, data: Omit<FornecedorRow, "id" | "wedding_id" | "is_demo">) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO fornecedores (id, wedding_id, nome, categoria, telefone, whatsapp, email, instagram, observacoes)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(id, weddingId, data.nome, data.categoria, data.telefone, data.whatsapp, data.email, data.instagram, data.observacoes);
  logHistorico(weddingId, "created", "fornecedor", id, `Fornecedor criado: ${data.nome}`);
  return id;
}

export function updateFornecedor(weddingId: string, id: string, data: Omit<FornecedorRow, "id" | "wedding_id" | "is_demo">) {
  const db = getDb();
  db.prepare(
    `UPDATE fornecedores SET nome=?, categoria=?, telefone=?, whatsapp=?, email=?, instagram=?, observacoes=?, updated_at=datetime('now')
     WHERE wedding_id=? AND id=?`
  ).run(data.nome, data.categoria, data.telefone, data.whatsapp, data.email, data.instagram, data.observacoes, weddingId, id);
  logHistorico(weddingId, "updated", "fornecedor", id, `Fornecedor atualizado: ${data.nome}`);
}

export function deleteFornecedor(weddingId: string, id: string) {
  const db = getDb();
  const f = getFornecedor(weddingId, id);
  db.prepare("DELETE FROM fornecedores WHERE wedding_id = ? AND id = ?").run(weddingId, id);
  logHistorico(weddingId, "deleted", "fornecedor", id, `Fornecedor excluído: ${f?.nome ?? id}`);
}

// ---------- Despesas ----------
export interface DespesaInput {
  fornecedor_id: string | null;
  nome: string;
  categoria: string;
  descricao: string;
  data_contratacao: string;
  valor_total_cents: number;
  tipo_pagamento: "avista" | "parcelado" | "entrada_parcelas" | "recorrente" | "a_combinar";
  num_parcelas: number;
  valor_entrada_cents: number;
  periodicidade: Periodicidade;
  intervalo_dias: number;
  cartao: string;
  data_primeira_fatura: string | null;
  observacoes: string;
}

export interface DespesaRow extends DespesaInput {
  id: string;
  wedding_id: string;
  is_demo: number;
  created_at: string;
}

export function listDespesas(weddingId: string): DespesaRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM despesas WHERE wedding_id = ? ORDER BY data_contratacao DESC")
    .all(weddingId) as DespesaRow[];
}

export function getDespesa(weddingId: string, id: string): DespesaRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM despesas WHERE wedding_id = ? AND id = ?")
    .get(weddingId, id) as DespesaRow | undefined;
}

/** Creates an expense and auto-generates its installments according to business rules. */
export function createDespesa(weddingId: string, data: DespesaInput): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO despesas (id, wedding_id, fornecedor_id, nome, categoria, descricao, data_contratacao,
      valor_total_cents, tipo_pagamento, num_parcelas, valor_entrada_cents, periodicidade, intervalo_dias,
      cartao, data_primeira_fatura, observacoes)
     VALUES (@id,@wedding_id,@fornecedor_id,@nome,@categoria,@descricao,@data_contratacao,
      @valor_total_cents,@tipo_pagamento,@num_parcelas,@valor_entrada_cents,@periodicidade,@intervalo_dias,
      @cartao,@data_primeira_fatura,@observacoes)`
  ).run({ id, wedding_id: weddingId, ...data });

  regenerateParcelas(id, data);
  logHistorico(weddingId, "created", "despesa", id, `Despesa criada: ${data.nome} (${formatCentsShort(data.valor_total_cents)})`);
  return id;
}

export function updateDespesa(weddingId: string, id: string, data: DespesaInput, regenerarParcelas: boolean) {
  const db = getDb();
  db.prepare(
    `UPDATE despesas SET fornecedor_id=@fornecedor_id, nome=@nome, categoria=@categoria, descricao=@descricao,
      data_contratacao=@data_contratacao, valor_total_cents=@valor_total_cents, tipo_pagamento=@tipo_pagamento,
      num_parcelas=@num_parcelas, valor_entrada_cents=@valor_entrada_cents, periodicidade=@periodicidade,
      intervalo_dias=@intervalo_dias, cartao=@cartao, data_primeira_fatura=@data_primeira_fatura,
      observacoes=@observacoes, updated_at=datetime('now')
     WHERE wedding_id=@wedding_id AND id=@id`
  ).run({ id, wedding_id: weddingId, ...data });

  if (regenerarParcelas) {
    db.prepare("DELETE FROM parcelas WHERE despesa_id = ?").run(id);
    regenerateParcelas(id, data);
  }
  logHistorico(weddingId, "updated", "despesa", id, `Despesa atualizada: ${data.nome}`);
}

export function deleteDespesa(weddingId: string, id: string) {
  const db = getDb();
  const d = getDespesa(weddingId, id);
  db.prepare("DELETE FROM despesas WHERE wedding_id = ? AND id = ?").run(weddingId, id);
  logHistorico(weddingId, "deleted", "despesa", id, `Despesa excluída: ${d?.nome ?? id}`);
}

/** Counts installments + payments linked to a despesa, used to warn before deletion. */
export function despesaDeletionImpact(id: string) {
  const db = getDb();
  const parcelas = db.prepare("SELECT COUNT(*) as c FROM parcelas WHERE despesa_id = ?").get(id) as { c: number };
  const pagamentos = db
    .prepare(
      `SELECT COUNT(*) as c FROM pagamentos WHERE parcela_id IN (SELECT id FROM parcelas WHERE despesa_id = ?)`
    )
    .get(id) as { c: number };
  return { numParcelas: parcelas.c, numPagamentos: pagamentos.c };
}

function regenerateParcelas(despesaId: string, data: DespesaInput) {
  const db = getDb();
  if (data.tipo_pagamento === "a_combinar") return; // no installments yet

  if (data.tipo_pagamento === "avista") {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento) VALUES (?,?,?,?,?,?)`
    ).run(id, despesaId, 1, "Pagamento único", data.valor_total_cents, data.data_contratacao);
    return;
  }

  if (data.tipo_pagamento === "recorrente") {
    // Recurring: generate num_parcelas occurrences of the full value (e.g. monthly subscription-like cost)
    const gerados = generateInstallments({
      valorTotalCents: data.valor_total_cents * Math.max(1, data.num_parcelas),
      valorEntradaCents: 0,
      numParcelas: Math.max(1, data.num_parcelas),
      dataContratacao: data.data_contratacao,
      periodicidade: data.periodicidade,
      intervaloDias: data.intervalo_dias,
    });
    const insert = db.prepare(
      `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento) VALUES (?,?,?,?,?,?)`
    );
    for (const g of gerados) {
      insert.run(randomUUID(), despesaId, g.numero, g.label, g.valorCents, g.vencimento);
    }
    return;
  }

  // parcelado | entrada_parcelas
  const gerados = generateInstallments({
    valorTotalCents: data.valor_total_cents,
    valorEntradaCents: data.tipo_pagamento === "entrada_parcelas" ? data.valor_entrada_cents : 0,
    numParcelas: Math.max(1, data.num_parcelas),
    dataContratacao: data.data_contratacao,
    periodicidade: data.periodicidade,
    intervaloDias: data.intervalo_dias,
  });
  const insert = db.prepare(
    `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento) VALUES (?,?,?,?,?,?)`
  );
  for (const g of gerados) {
    insert.run(randomUUID(), despesaId, g.numero, g.label, g.valorCents, g.vencimento);
  }
}

function formatCentsShort(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---------- Parcelas ----------
export interface ParcelaRow {
  id: string;
  despesa_id: string;
  numero: number;
  label: string;
  valor_cents: number;
  vencimento: string;
  forma_pagamento: string;
  observacao: string;
  cancelada: number;
}

export interface PagamentoRow {
  id: string;
  parcela_id: string;
  valor_pago_cents: number;
  data_pagamento: string;
  forma_pagamento: string;
  conta_cartao: string;
  observacao: string;
  comprovante_path: string | null;
  created_at: string;
}

export function listParcelasForWedding(weddingId: string) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT p.*, d.nome as despesa_nome, d.categoria as despesa_categoria, d.fornecedor_id, d.wedding_id
       FROM parcelas p JOIN despesas d ON d.id = p.despesa_id
       WHERE d.wedding_id = ? ORDER BY p.vencimento ASC`
    )
    .all(weddingId) as (ParcelaRow & { despesa_nome: string; despesa_categoria: string; fornecedor_id: string | null; wedding_id: string })[];
  return rows;
}

export function listPagamentosForParcela(parcelaId: string): PagamentoRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM pagamentos WHERE parcela_id = ? ORDER BY data_pagamento ASC")
    .all(parcelaId) as PagamentoRow[];
}

export function listPagamentosForWedding(weddingId: string): PagamentoRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT pg.* FROM pagamentos pg
       JOIN parcelas p ON p.id = pg.parcela_id
       JOIN despesas d ON d.id = p.despesa_id
       WHERE d.wedding_id = ? ORDER BY pg.data_pagamento DESC`
    )
    .all(weddingId) as PagamentoRow[];
}

export function getParcelaWithContext(weddingId: string, id: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT p.*, d.nome as despesa_nome, d.categoria as despesa_categoria, d.fornecedor_id, d.wedding_id
       FROM parcelas p JOIN despesas d ON d.id = p.despesa_id
       WHERE d.wedding_id = ? AND p.id = ?`
    )
    .get(weddingId, id) as (ParcelaRow & { despesa_nome: string; despesa_categoria: string; fornecedor_id: string | null; wedding_id: string }) | undefined;
  return row;
}

export function updateParcela(
  weddingId: string,
  id: string,
  data: { valor_cents?: number; vencimento?: string; forma_pagamento?: string; observacao?: string; cancelada?: boolean }
) {
  const db = getDb();
  const current = getParcelaWithContext(weddingId, id);
  if (!current) throw new Error("Parcela não encontrada");
  const merged = {
    valor_cents: data.valor_cents ?? current.valor_cents,
    vencimento: data.vencimento ?? current.vencimento,
    forma_pagamento: data.forma_pagamento ?? current.forma_pagamento,
    observacao: data.observacao ?? current.observacao,
    cancelada: data.cancelada !== undefined ? (data.cancelada ? 1 : 0) : current.cancelada,
  };
  db.prepare(
    `UPDATE parcelas SET valor_cents=?, vencimento=?, forma_pagamento=?, observacao=?, cancelada=?, updated_at=datetime('now') WHERE id=?`
  ).run(merged.valor_cents, merged.vencimento, merged.forma_pagamento, merged.observacao, merged.cancelada, id);
  logHistorico(
    weddingId,
    merged.cancelada ? "cancelled" : "updated",
    "parcela",
    id,
    `Parcela ${current.numero} de "${current.despesa_nome}" atualizada`
  );
}

export function registrarPagamento(
  weddingId: string,
  parcelaId: string,
  data: {
    valor_pago_cents: number;
    data_pagamento: string;
    forma_pagamento: string;
    conta_cartao: string;
    observacao: string;
    comprovante_path: string | null;
  }
) {
  const db = getDb();
  const parcela = getParcelaWithContext(weddingId, parcelaId);
  if (!parcela) throw new Error("Parcela não encontrada");
  const id = randomUUID();
  db.prepare(
    `INSERT INTO pagamentos (id, parcela_id, valor_pago_cents, data_pagamento, forma_pagamento, conta_cartao, observacao, comprovante_path)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    id,
    parcelaId,
    data.valor_pago_cents,
    data.data_pagamento,
    data.forma_pagamento,
    data.conta_cartao,
    data.observacao,
    data.comprovante_path
  );
  logHistorico(
    weddingId,
    "paid",
    "pagamento",
    id,
    `Pagamento registrado para parcela ${parcela.numero} de "${parcela.despesa_nome}": ${formatCentsShort(data.valor_pago_cents)}`
  );
  return id;
}

export function deletePagamento(weddingId: string, pagamentoId: string) {
  const db = getDb();
  db.prepare(
    `DELETE FROM pagamentos WHERE id = ? AND parcela_id IN (
      SELECT p.id FROM parcelas p JOIN despesas d ON d.id = p.despesa_id WHERE d.wedding_id = ?
    )`
  ).run(pagamentoId, weddingId);
  logHistorico(weddingId, "deleted", "pagamento", pagamentoId, "Pagamento removido");
}

export function computeParcelasComputed(weddingId: string, today: Date = new Date()) {
  const parcelas = listParcelasForWedding(weddingId);
  return parcelas.map((p) => {
    const pagamentos = listPagamentosForParcela(p.id);
    const computed = computeParcela(
      { id: p.id, valorCents: p.valor_cents, vencimento: p.vencimento, cancelada: !!p.cancelada, pagamentos: pagamentos.map((pg) => ({ valorPagoCents: pg.valor_pago_cents })) },
      today
    );
    return { ...p, ...computed };
  });
}

// ---------- Checklist ----------
export interface ChecklistRow {
  id: string;
  wedding_id: string;
  nome: string;
  prazo: string | null;
  responsavel: string;
  status: "pendente" | "em_andamento" | "concluido";
  observacao: string;
  is_demo: number;
}

export function listChecklist(weddingId: string): ChecklistRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM checklist WHERE wedding_id = ? ORDER BY (prazo IS NULL), prazo ASC")
    .all(weddingId) as ChecklistRow[];
}

export function createChecklistItem(weddingId: string, data: Omit<ChecklistRow, "id" | "wedding_id" | "is_demo">) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO checklist (id, wedding_id, nome, prazo, responsavel, status, observacao) VALUES (?,?,?,?,?,?,?)`
  ).run(id, weddingId, data.nome, data.prazo, data.responsavel, data.status, data.observacao);
  logHistorico(weddingId, "created", "checklist", id, `Tarefa criada: ${data.nome}`);
  return id;
}

export function updateChecklistItem(weddingId: string, id: string, data: Omit<ChecklistRow, "id" | "wedding_id" | "is_demo">) {
  const db = getDb();
  db.prepare(
    `UPDATE checklist SET nome=?, prazo=?, responsavel=?, status=?, observacao=?, updated_at=datetime('now') WHERE wedding_id=? AND id=?`
  ).run(data.nome, data.prazo, data.responsavel, data.status, data.observacao, weddingId, id);
  logHistorico(weddingId, "updated", "checklist", id, `Tarefa atualizada: ${data.nome}`);
}

export function deleteChecklistItem(weddingId: string, id: string) {
  const db = getDb();
  db.prepare("DELETE FROM checklist WHERE wedding_id = ? AND id = ?").run(weddingId, id);
  logHistorico(weddingId, "deleted", "checklist", id, "Tarefa excluída");
}

// ---------- Categoria orçamentos ----------
export function listCategoriaOrcamentos(weddingId: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM categoria_orcamentos WHERE wedding_id = ?").all(weddingId) as {
    id: string;
    wedding_id: string;
    categoria: string;
    orcamento_cents: number;
  }[];
}

export function setCategoriaOrcamento(weddingId: string, categoria: string, orcamentoCents: number) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM categoria_orcamentos WHERE wedding_id = ? AND categoria = ?")
    .get(weddingId, categoria) as { id: string } | undefined;
  if (existing) {
    db.prepare("UPDATE categoria_orcamentos SET orcamento_cents = ? WHERE id = ?").run(orcamentoCents, existing.id);
  } else {
    db.prepare(
      "INSERT INTO categoria_orcamentos (id, wedding_id, categoria, orcamento_cents) VALUES (?,?,?,?)"
    ).run(randomUUID(), weddingId, categoria, orcamentoCents);
  }
}

// ---------- Historico ----------
export function listHistorico(weddingId: string, limit = 50) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM historico WHERE wedding_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(weddingId, limit) as { id: string; tipo: string; entidade: string; entidade_id: string; descricao: string; created_at: string }[];
}

// ---------- Demo data removal ----------
export function removeDemoData(weddingId: string) {
  const db = getDb();
  db.prepare("DELETE FROM despesas WHERE wedding_id = ? AND is_demo = 1").run(weddingId);
  db.prepare("DELETE FROM fornecedores WHERE wedding_id = ? AND is_demo = 1").run(weddingId);
  db.prepare("DELETE FROM checklist WHERE wedding_id = ? AND is_demo = 1").run(weddingId);
  logHistorico(weddingId, "deleted", "orcamento", weddingId, "Dados de demonstração removidos");
}
