import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { getDb, logHistorico } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const weddingId = ctx.wedding.id;

  const wedding = db.prepare("SELECT * FROM weddings WHERE id = ?").get(weddingId);
  const fornecedores = db.prepare("SELECT * FROM fornecedores WHERE wedding_id = ?").all(weddingId);
  const despesas = db.prepare("SELECT * FROM despesas WHERE wedding_id = ?").all(weddingId);
  const despesaIds = (despesas as { id: string }[]).map((d) => d.id);
  const parcelas =
    despesaIds.length > 0
      ? db
          .prepare(
            `SELECT * FROM parcelas WHERE despesa_id IN (${despesaIds.map(() => "?").join(",")})`
          )
          .all(...despesaIds)
      : [];
  const parcelaIds = (parcelas as { id: string }[]).map((p) => p.id);
  const pagamentos =
    parcelaIds.length > 0
      ? db
          .prepare(`SELECT * FROM pagamentos WHERE parcela_id IN (${parcelaIds.map(() => "?").join(",")})`)
          .all(...parcelaIds)
      : [];
  const checklist = db.prepare("SELECT * FROM checklist WHERE wedding_id = ?").all(weddingId);
  const categoriaOrcamentos = db
    .prepare("SELECT * FROM categoria_orcamentos WHERE wedding_id = ?")
    .all(weddingId);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    wedding,
    fornecedores,
    despesas,
    parcelas,
    pagamentos,
    checklist,
    categoriaOrcamentos,
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="backup-casamento-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

interface BackupShape {
  fornecedores?: Record<string, unknown>[];
  despesas?: Record<string, unknown>[];
  parcelas?: Record<string, unknown>[];
  pagamentos?: Record<string, unknown>[];
  checklist?: Record<string, unknown>[];
  categoriaOrcamentos?: Record<string, unknown>[];
}

export async function POST(req: NextRequest) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const weddingId = ctx.wedding.id;
  const data = (await req.json()) as BackupShape;

  const idMapFornecedor = new Map<string, string>();
  const idMapDespesa = new Map<string, string>();
  const idMapParcela = new Map<string, string>();

  const tx = db.transaction(() => {
    for (const f of data.fornecedores ?? []) {
      const newId = randomUUID();
      idMapFornecedor.set(f.id as string, newId);
      db.prepare(
        `INSERT INTO fornecedores (id, wedding_id, nome, categoria, telefone, whatsapp, email, instagram, observacoes)
         VALUES (?,?,?,?,?,?,?,?,?)`
      ).run(newId, weddingId, f.nome, f.categoria, f.telefone, f.whatsapp, f.email, f.instagram, f.observacoes);
    }
    for (const d of data.despesas ?? []) {
      const newId = randomUUID();
      idMapDespesa.set(d.id as string, newId);
      const fornecedorId = d.fornecedor_id ? idMapFornecedor.get(d.fornecedor_id as string) ?? null : null;
      db.prepare(
        `INSERT INTO despesas (id, wedding_id, fornecedor_id, nome, categoria, descricao, data_contratacao,
          valor_total_cents, tipo_pagamento, num_parcelas, valor_entrada_cents, periodicidade, intervalo_dias,
          cartao, data_primeira_fatura, observacoes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        newId,
        weddingId,
        fornecedorId,
        d.nome,
        d.categoria,
        d.descricao,
        d.data_contratacao,
        d.valor_total_cents,
        d.tipo_pagamento,
        d.num_parcelas,
        d.valor_entrada_cents,
        d.periodicidade,
        d.intervalo_dias,
        d.cartao,
        d.data_primeira_fatura,
        d.observacoes
      );
    }
    for (const p of data.parcelas ?? []) {
      const newId = randomUUID();
      idMapParcela.set(p.id as string, newId);
      const despesaId = idMapDespesa.get(p.despesa_id as string);
      if (!despesaId) continue;
      db.prepare(
        `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento, forma_pagamento, observacao, cancelada)
         VALUES (?,?,?,?,?,?,?,?,?)`
      ).run(newId, despesaId, p.numero, p.label, p.valor_cents, p.vencimento, p.forma_pagamento, p.observacao, p.cancelada);
    }
    for (const pg of data.pagamentos ?? []) {
      const parcelaId = idMapParcela.get(pg.parcela_id as string);
      if (!parcelaId) continue;
      db.prepare(
        `INSERT INTO pagamentos (id, parcela_id, valor_pago_cents, data_pagamento, forma_pagamento, conta_cartao, observacao, comprovante_path)
         VALUES (?,?,?,?,?,?,?,?)`
      ).run(randomUUID(), parcelaId, pg.valor_pago_cents, pg.data_pagamento, pg.forma_pagamento, pg.conta_cartao, pg.observacao, null);
    }
    for (const c of data.checklist ?? []) {
      db.prepare(
        `INSERT INTO checklist (id, wedding_id, nome, prazo, responsavel, status, observacao) VALUES (?,?,?,?,?,?,?)`
      ).run(randomUUID(), weddingId, c.nome, c.prazo, c.responsavel, c.status, c.observacao);
    }
    for (const co of data.categoriaOrcamentos ?? []) {
      db.prepare(
        `INSERT OR REPLACE INTO categoria_orcamentos (id, wedding_id, categoria, orcamento_cents) VALUES (?,?,?,?)`
      ).run(randomUUID(), weddingId, co.categoria, co.orcamento_cents);
    }
  });

  tx();
  logHistorico(weddingId, "created", "orcamento", weddingId, "Backup restaurado a partir de arquivo JSON");

  return NextResponse.json({ ok: true });
}
