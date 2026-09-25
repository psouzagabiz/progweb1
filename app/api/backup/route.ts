import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { getDb, logHistorico } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = await getDb();
  const weddingId = ctx.wedding.id;

  const wedding = (await db.query("SELECT * FROM weddings WHERE id = $1", [weddingId])).rows[0];
  const fornecedores = (await db.query("SELECT * FROM fornecedores WHERE wedding_id = $1", [weddingId])).rows;
  const despesas = (await db.query("SELECT * FROM despesas WHERE wedding_id = $1", [weddingId])).rows;
  const despesaIds = (despesas as { id: string }[]).map((d) => d.id);
  const parcelas =
    despesaIds.length > 0
      ? (
          await db.query(
            `SELECT * FROM parcelas WHERE despesa_id = ANY($1::text[])`,
            [despesaIds]
          )
        ).rows
      : [];
  const parcelaIds = (parcelas as { id: string }[]).map((p) => p.id);
  const pagamentos =
    parcelaIds.length > 0
      ? (
          await db.query(
            `SELECT * FROM pagamentos WHERE parcela_id = ANY($1::text[])`,
            [parcelaIds]
          )
        ).rows
      : [];
  const checklist = (await db.query("SELECT * FROM checklist WHERE wedding_id = $1", [weddingId])).rows;
  const categoriaOrcamentos = (
    await db.query("SELECT * FROM categoria_orcamentos WHERE wedding_id = $1", [weddingId])
  ).rows;

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
  const pool = await getDb();
  const weddingId = ctx.wedding.id;
  const data = (await req.json()) as BackupShape;

  const idMapFornecedor = new Map<string, string>();
  const idMapDespesa = new Map<string, string>();
  const idMapParcela = new Map<string, string>();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const f of data.fornecedores ?? []) {
      const newId = randomUUID();
      idMapFornecedor.set(f.id as string, newId);
      await client.query(
        `INSERT INTO fornecedores (id, wedding_id, nome, categoria, telefone, whatsapp, email, instagram, observacoes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newId, weddingId, f.nome, f.categoria, f.telefone, f.whatsapp, f.email, f.instagram, f.observacoes]
      );
    }
    for (const d of data.despesas ?? []) {
      const newId = randomUUID();
      idMapDespesa.set(d.id as string, newId);
      const fornecedorId = d.fornecedor_id ? idMapFornecedor.get(d.fornecedor_id as string) ?? null : null;
      await client.query(
        `INSERT INTO despesas (id, wedding_id, fornecedor_id, nome, categoria, descricao, data_contratacao,
          valor_total_cents, tipo_pagamento, num_parcelas, valor_entrada_cents, periodicidade, intervalo_dias,
          cartao, data_primeira_fatura, observacoes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
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
          d.observacoes,
        ]
      );
    }
    for (const p of data.parcelas ?? []) {
      const newId = randomUUID();
      idMapParcela.set(p.id as string, newId);
      const despesaId = idMapDespesa.get(p.despesa_id as string);
      if (!despesaId) continue;
      await client.query(
        `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento, forma_pagamento, observacao, cancelada)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newId, despesaId, p.numero, p.label, p.valor_cents, p.vencimento, p.forma_pagamento, p.observacao, p.cancelada]
      );
    }
    for (const pg of data.pagamentos ?? []) {
      const parcelaId = idMapParcela.get(pg.parcela_id as string);
      if (!parcelaId) continue;
      await client.query(
        `INSERT INTO pagamentos (id, parcela_id, valor_pago_cents, data_pagamento, forma_pagamento, conta_cartao, observacao, comprovante_path)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [randomUUID(), parcelaId, pg.valor_pago_cents, pg.data_pagamento, pg.forma_pagamento, pg.conta_cartao, pg.observacao, null]
      );
    }
    for (const c of data.checklist ?? []) {
      await client.query(
        `INSERT INTO checklist (id, wedding_id, nome, prazo, responsavel, status, observacao) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [randomUUID(), weddingId, c.nome, c.prazo, c.responsavel, c.status, c.observacao]
      );
    }
    for (const co of data.categoriaOrcamentos ?? []) {
      await client.query(
        `INSERT INTO categoria_orcamentos (id, wedding_id, categoria, orcamento_cents)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (wedding_id, categoria) DO UPDATE SET orcamento_cents = EXCLUDED.orcamento_cents`,
        [randomUUID(), weddingId, co.categoria, co.orcamento_cents]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  await logHistorico(weddingId, "created", "orcamento", weddingId, "Backup restaurado a partir de arquivo JSON");

  return NextResponse.json({ ok: true });
}
