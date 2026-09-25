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
export async function getOrCreateWedding(userId: string): Promise<Wedding> {
  const db = await getDb();
  let res = await db.query(
    "SELECT * FROM weddings WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1",
    [userId]
  );
  let wedding = res.rows[0] as Wedding | undefined;
  if (!wedding) {
    const id = randomUUID();
    await db.query(
      `INSERT INTO weddings (id, user_id, noivo1, noivo2, orcamento_maximo_cents, observacoes) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, userId, "", "", 0, ""]
    );
    res = await db.query("SELECT * FROM weddings WHERE id = $1", [id]);
    wedding = res.rows[0] as Wedding;
  }
  return wedding;
}

export async function updateWedding(
  id: string,
  data: Partial<Pick<Wedding, "noivo1" | "noivo2" | "data_casamento" | "orcamento_maximo_cents" | "observacoes">>
) {
  const db = await getDb();
  const currentRes = await db.query("SELECT * FROM weddings WHERE id = $1", [id]);
  const current = currentRes.rows[0] as Wedding;
  const merged = { ...current, ...data };
  await db.query(
    `UPDATE weddings SET noivo1=$1, noivo2=$2, data_casamento=$3, orcamento_maximo_cents=$4, observacoes=$5 WHERE id=$6`,
    [merged.noivo1, merged.noivo2, merged.data_casamento, merged.orcamento_maximo_cents, merged.observacoes, id]
  );
  await logHistorico(id, "updated", "orcamento", id, "Orçamento/dados do casamento atualizados");
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

export async function listFornecedores(weddingId: string): Promise<FornecedorRow[]> {
  const db = await getDb();
  const res = await db.query(
    "SELECT * FROM fornecedores WHERE wedding_id = $1 ORDER BY nome ASC",
    [weddingId]
  );
  return res.rows as FornecedorRow[];
}

export async function getFornecedor(weddingId: string, id: string): Promise<FornecedorRow | undefined> {
  const db = await getDb();
  const res = await db.query(
    "SELECT * FROM fornecedores WHERE wedding_id = $1 AND id = $2",
    [weddingId, id]
  );
  return res.rows[0] as FornecedorRow | undefined;
}

export async function createFornecedor(weddingId: string, data: Omit<FornecedorRow, "id" | "wedding_id" | "is_demo">) {
  const db = await getDb();
  const id = randomUUID();
  await db.query(
    `INSERT INTO fornecedores (id, wedding_id, nome, categoria, telefone, whatsapp, email, instagram, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, weddingId, data.nome, data.categoria, data.telefone, data.whatsapp, data.email, data.instagram, data.observacoes]
  );
  await logHistorico(weddingId, "created", "fornecedor", id, `Fornecedor criado: ${data.nome}`);
  return id;
}

export async function updateFornecedor(weddingId: string, id: string, data: Omit<FornecedorRow, "id" | "wedding_id" | "is_demo">) {
  const db = await getDb();
  await db.query(
    `UPDATE fornecedores SET nome=$1, categoria=$2, telefone=$3, whatsapp=$4, email=$5, instagram=$6, observacoes=$7, updated_at=now()
     WHERE wedding_id=$8 AND id=$9`,
    [data.nome, data.categoria, data.telefone, data.whatsapp, data.email, data.instagram, data.observacoes, weddingId, id]
  );
  await logHistorico(weddingId, "updated", "fornecedor", id, `Fornecedor atualizado: ${data.nome}`);
}

export async function deleteFornecedor(weddingId: string, id: string) {
  const db = await getDb();
  const f = await getFornecedor(weddingId, id);
  await db.query("DELETE FROM fornecedores WHERE wedding_id = $1 AND id = $2", [weddingId, id]);
  await logHistorico(weddingId, "deleted", "fornecedor", id, `Fornecedor excluído: ${f?.nome ?? id}`);
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

export async function listDespesas(weddingId: string): Promise<DespesaRow[]> {
  const db = await getDb();
  const res = await db.query(
    "SELECT * FROM despesas WHERE wedding_id = $1 ORDER BY data_contratacao DESC",
    [weddingId]
  );
  return res.rows as DespesaRow[];
}

export async function getDespesa(weddingId: string, id: string): Promise<DespesaRow | undefined> {
  const db = await getDb();
  const res = await db.query(
    "SELECT * FROM despesas WHERE wedding_id = $1 AND id = $2",
    [weddingId, id]
  );
  return res.rows[0] as DespesaRow | undefined;
}

/** Creates an expense and auto-generates its installments according to business rules. */
export async function createDespesa(weddingId: string, data: DespesaInput): Promise<string> {
  const db = await getDb();
  const id = randomUUID();
  await db.query(
    `INSERT INTO despesas (id, wedding_id, fornecedor_id, nome, categoria, descricao, data_contratacao,
      valor_total_cents, tipo_pagamento, num_parcelas, valor_entrada_cents, periodicidade, intervalo_dias,
      cartao, data_primeira_fatura, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      id,
      weddingId,
      data.fornecedor_id,
      data.nome,
      data.categoria,
      data.descricao,
      data.data_contratacao,
      data.valor_total_cents,
      data.tipo_pagamento,
      data.num_parcelas,
      data.valor_entrada_cents,
      data.periodicidade,
      data.intervalo_dias,
      data.cartao,
      data.data_primeira_fatura,
      data.observacoes,
    ]
  );

  await regenerateParcelas(id, data);
  await logHistorico(weddingId, "created", "despesa", id, `Despesa criada: ${data.nome} (${formatCentsShort(data.valor_total_cents)})`);
  return id;
}

export async function updateDespesa(weddingId: string, id: string, data: DespesaInput, regenerarParcelas: boolean) {
  const db = await getDb();
  await db.query(
    `UPDATE despesas SET fornecedor_id=$1, nome=$2, categoria=$3, descricao=$4,
      data_contratacao=$5, valor_total_cents=$6, tipo_pagamento=$7,
      num_parcelas=$8, valor_entrada_cents=$9, periodicidade=$10,
      intervalo_dias=$11, cartao=$12, data_primeira_fatura=$13,
      observacoes=$14, updated_at=now()
     WHERE wedding_id=$15 AND id=$16`,
    [
      data.fornecedor_id,
      data.nome,
      data.categoria,
      data.descricao,
      data.data_contratacao,
      data.valor_total_cents,
      data.tipo_pagamento,
      data.num_parcelas,
      data.valor_entrada_cents,
      data.periodicidade,
      data.intervalo_dias,
      data.cartao,
      data.data_primeira_fatura,
      data.observacoes,
      weddingId,
      id,
    ]
  );

  if (regenerarParcelas) {
    await db.query("DELETE FROM parcelas WHERE despesa_id = $1", [id]);
    await regenerateParcelas(id, data);
  }
  await logHistorico(weddingId, "updated", "despesa", id, `Despesa atualizada: ${data.nome}`);
}

export async function deleteDespesa(weddingId: string, id: string) {
  const db = await getDb();
  const d = await getDespesa(weddingId, id);
  await db.query("DELETE FROM despesas WHERE wedding_id = $1 AND id = $2", [weddingId, id]);
  await logHistorico(weddingId, "deleted", "despesa", id, `Despesa excluída: ${d?.nome ?? id}`);
}

/** Counts installments + payments linked to a despesa, used to warn before deletion. */
export async function despesaDeletionImpact(id: string) {
  const db = await getDb();
  const parcelasRes = await db.query("SELECT COUNT(*) as c FROM parcelas WHERE despesa_id = $1", [id]);
  const pagamentosRes = await db.query(
    `SELECT COUNT(*) as c FROM pagamentos WHERE parcela_id IN (SELECT id FROM parcelas WHERE despesa_id = $1)`,
    [id]
  );
  return {
    numParcelas: Number(parcelasRes.rows[0].c),
    numPagamentos: Number(pagamentosRes.rows[0].c),
  };
}

async function regenerateParcelas(despesaId: string, data: DespesaInput) {
  const db = await getDb();
  if (data.tipo_pagamento === "a_combinar") return; // no installments yet

  if (data.tipo_pagamento === "avista") {
    const id = randomUUID();
    await db.query(
      `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, despesaId, 1, "Pagamento único", data.valor_total_cents, data.data_contratacao]
    );
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
    for (const g of gerados) {
      await db.query(
        `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento) VALUES ($1,$2,$3,$4,$5,$6)`,
        [randomUUID(), despesaId, g.numero, g.label, g.valorCents, g.vencimento]
      );
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
  for (const g of gerados) {
    await db.query(
      `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento) VALUES ($1,$2,$3,$4,$5,$6)`,
      [randomUUID(), despesaId, g.numero, g.label, g.valorCents, g.vencimento]
    );
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

export async function listParcelasForWedding(weddingId: string) {
  const db = await getDb();
  const res = await db.query(
    `SELECT p.*, d.nome as despesa_nome, d.categoria as despesa_categoria, d.fornecedor_id, d.wedding_id
     FROM parcelas p JOIN despesas d ON d.id = p.despesa_id
     WHERE d.wedding_id = $1 ORDER BY p.vencimento ASC`,
    [weddingId]
  );
  return res.rows as (ParcelaRow & { despesa_nome: string; despesa_categoria: string; fornecedor_id: string | null; wedding_id: string })[];
}

export async function listPagamentosForParcela(parcelaId: string): Promise<PagamentoRow[]> {
  const db = await getDb();
  const res = await db.query(
    "SELECT * FROM pagamentos WHERE parcela_id = $1 ORDER BY data_pagamento ASC",
    [parcelaId]
  );
  return res.rows as PagamentoRow[];
}

export async function listPagamentosForWedding(weddingId: string): Promise<PagamentoRow[]> {
  const db = await getDb();
  const res = await db.query(
    `SELECT pg.* FROM pagamentos pg
     JOIN parcelas p ON p.id = pg.parcela_id
     JOIN despesas d ON d.id = p.despesa_id
     WHERE d.wedding_id = $1 ORDER BY pg.data_pagamento DESC`,
    [weddingId]
  );
  return res.rows as PagamentoRow[];
}

export async function getParcelaWithContext(weddingId: string, id: string) {
  const db = await getDb();
  const res = await db.query(
    `SELECT p.*, d.nome as despesa_nome, d.categoria as despesa_categoria, d.fornecedor_id, d.wedding_id
     FROM parcelas p JOIN despesas d ON d.id = p.despesa_id
     WHERE d.wedding_id = $1 AND p.id = $2`,
    [weddingId, id]
  );
  return res.rows[0] as (ParcelaRow & { despesa_nome: string; despesa_categoria: string; fornecedor_id: string | null; wedding_id: string }) | undefined;
}

export async function updateParcela(
  weddingId: string,
  id: string,
  data: { valor_cents?: number; vencimento?: string; forma_pagamento?: string; observacao?: string; cancelada?: boolean }
) {
  const db = await getDb();
  const current = await getParcelaWithContext(weddingId, id);
  if (!current) throw new Error("Parcela não encontrada");
  const merged = {
    valor_cents: data.valor_cents ?? current.valor_cents,
    vencimento: data.vencimento ?? current.vencimento,
    forma_pagamento: data.forma_pagamento ?? current.forma_pagamento,
    observacao: data.observacao ?? current.observacao,
    cancelada: data.cancelada !== undefined ? (data.cancelada ? 1 : 0) : current.cancelada,
  };
  await db.query(
    `UPDATE parcelas SET valor_cents=$1, vencimento=$2, forma_pagamento=$3, observacao=$4, cancelada=$5, updated_at=now() WHERE id=$6`,
    [merged.valor_cents, merged.vencimento, merged.forma_pagamento, merged.observacao, merged.cancelada, id]
  );
  await logHistorico(
    weddingId,
    merged.cancelada ? "cancelled" : "updated",
    "parcela",
    id,
    `Parcela ${current.numero} de "${current.despesa_nome}" atualizada`
  );
}

export async function registrarPagamento(
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
  const db = await getDb();
  const parcela = await getParcelaWithContext(weddingId, parcelaId);
  if (!parcela) throw new Error("Parcela não encontrada");
  const id = randomUUID();
  await db.query(
    `INSERT INTO pagamentos (id, parcela_id, valor_pago_cents, data_pagamento, forma_pagamento, conta_cartao, observacao, comprovante_path)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      parcelaId,
      data.valor_pago_cents,
      data.data_pagamento,
      data.forma_pagamento,
      data.conta_cartao,
      data.observacao,
      data.comprovante_path,
    ]
  );
  await logHistorico(
    weddingId,
    "paid",
    "pagamento",
    id,
    `Pagamento registrado para parcela ${parcela.numero} de "${parcela.despesa_nome}": ${formatCentsShort(data.valor_pago_cents)}`
  );
  return id;
}

export async function deletePagamento(weddingId: string, pagamentoId: string) {
  const db = await getDb();
  await db.query(
    `DELETE FROM pagamentos WHERE id = $1 AND parcela_id IN (
      SELECT p.id FROM parcelas p JOIN despesas d ON d.id = p.despesa_id WHERE d.wedding_id = $2
    )`,
    [pagamentoId, weddingId]
  );
  await logHistorico(weddingId, "deleted", "pagamento", pagamentoId, "Pagamento removido");
}

export async function computeParcelasComputed(weddingId: string, today: Date = new Date()) {
  const parcelas = await listParcelasForWedding(weddingId);
  const results = [];
  for (const p of parcelas) {
    const pagamentos = await listPagamentosForParcela(p.id);
    const computed = computeParcela(
      { id: p.id, valorCents: p.valor_cents, vencimento: p.vencimento, cancelada: !!p.cancelada, pagamentos: pagamentos.map((pg) => ({ valorPagoCents: pg.valor_pago_cents })) },
      today
    );
    results.push({ ...p, ...computed });
  }
  return results;
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

export async function listChecklist(weddingId: string): Promise<ChecklistRow[]> {
  const db = await getDb();
  const res = await db.query(
    "SELECT * FROM checklist WHERE wedding_id = $1 ORDER BY (prazo IS NULL), prazo ASC",
    [weddingId]
  );
  return res.rows as ChecklistRow[];
}

export async function createChecklistItem(weddingId: string, data: Omit<ChecklistRow, "id" | "wedding_id" | "is_demo">) {
  const db = await getDb();
  const id = randomUUID();
  await db.query(
    `INSERT INTO checklist (id, wedding_id, nome, prazo, responsavel, status, observacao) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, weddingId, data.nome, data.prazo, data.responsavel, data.status, data.observacao]
  );
  await logHistorico(weddingId, "created", "checklist", id, `Tarefa criada: ${data.nome}`);
  return id;
}

export async function updateChecklistItem(weddingId: string, id: string, data: Omit<ChecklistRow, "id" | "wedding_id" | "is_demo">) {
  const db = await getDb();
  await db.query(
    `UPDATE checklist SET nome=$1, prazo=$2, responsavel=$3, status=$4, observacao=$5, updated_at=now() WHERE wedding_id=$6 AND id=$7`,
    [data.nome, data.prazo, data.responsavel, data.status, data.observacao, weddingId, id]
  );
  await logHistorico(weddingId, "updated", "checklist", id, `Tarefa atualizada: ${data.nome}`);
}

export async function deleteChecklistItem(weddingId: string, id: string) {
  const db = await getDb();
  await db.query("DELETE FROM checklist WHERE wedding_id = $1 AND id = $2", [weddingId, id]);
  await logHistorico(weddingId, "deleted", "checklist", id, "Tarefa excluída");
}

// ---------- Categoria orçamentos ----------
export async function listCategoriaOrcamentos(weddingId: string) {
  const db = await getDb();
  const res = await db.query("SELECT * FROM categoria_orcamentos WHERE wedding_id = $1", [weddingId]);
  return res.rows as {
    id: string;
    wedding_id: string;
    categoria: string;
    orcamento_cents: number;
  }[];
}

export async function setCategoriaOrcamento(weddingId: string, categoria: string, orcamentoCents: number) {
  const db = await getDb();
  const existingRes = await db.query(
    "SELECT id FROM categoria_orcamentos WHERE wedding_id = $1 AND categoria = $2",
    [weddingId, categoria]
  );
  const existing = existingRes.rows[0] as { id: string } | undefined;
  if (existing) {
    await db.query("UPDATE categoria_orcamentos SET orcamento_cents = $1 WHERE id = $2", [orcamentoCents, existing.id]);
  } else {
    await db.query(
      "INSERT INTO categoria_orcamentos (id, wedding_id, categoria, orcamento_cents) VALUES ($1,$2,$3,$4)",
      [randomUUID(), weddingId, categoria, orcamentoCents]
    );
  }
}

// ---------- Historico ----------
export async function listHistorico(weddingId: string, limit = 50) {
  const db = await getDb();
  const res = await db.query(
    "SELECT * FROM historico WHERE wedding_id = $1 ORDER BY created_at DESC LIMIT $2",
    [weddingId, limit]
  );
  return res.rows as { id: string; tipo: string; entidade: string; entidade_id: string; descricao: string; created_at: string }[];
}

// ---------- Demo data removal ----------
export async function removeDemoData(weddingId: string) {
  const db = await getDb();
  await db.query("DELETE FROM despesas WHERE wedding_id = $1 AND is_demo = 1", [weddingId]);
  await db.query("DELETE FROM fornecedores WHERE wedding_id = $1 AND is_demo = 1", [weddingId]);
  await db.query("DELETE FROM checklist WHERE wedding_id = $1 AND is_demo = 1", [weddingId]);
  await logHistorico(weddingId, "deleted", "orcamento", weddingId, "Dados de demonstração removidos");
}
