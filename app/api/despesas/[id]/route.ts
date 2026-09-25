import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import {
  deleteDespesa,
  despesaDeletionImpact,
  getDespesa,
  updateDespesa,
  type DespesaInput,
} from "@/lib/db/repo";
import { withApiError } from "@/lib/api/errors";

function parseInput(body: Record<string, unknown>): DespesaInput {
  return {
    fornecedor_id: (body.fornecedor_id as string) || null,
    nome: (body.nome as string) ?? "",
    categoria: (body.categoria as string) ?? "Outros",
    descricao: (body.descricao as string) ?? "",
    data_contratacao: (body.data_contratacao as string) ?? new Date().toISOString().slice(0, 10),
    valor_total_cents: Number(body.valor_total_cents) || 0,
    tipo_pagamento: (body.tipo_pagamento as DespesaInput["tipo_pagamento"]) ?? "a_combinar",
    num_parcelas: Number(body.num_parcelas) || 1,
    valor_entrada_cents: Number(body.valor_entrada_cents) || 0,
    periodicidade: (body.periodicidade as DespesaInput["periodicidade"]) ?? "mensal",
    intervalo_dias: Number(body.intervalo_dias) || 30,
    cartao: (body.cartao as string) ?? "",
    data_primeira_fatura: (body.data_primeira_fatura as string) || null,
    observacoes: (body.observacoes as string) ?? "",
  };
}

export const GET = withApiError("GET /api/despesas/[id]", async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const d = await getDespesa(ctx.wedding.id, id);
  if (!d) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ...d, impact: await despesaDeletionImpact(id) });
});

export const PUT = withApiError("PUT /api/despesas/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const regenerar = body.regenerar_parcelas !== false;
  await updateDespesa(ctx.wedding.id, id, parseInput(body), regenerar);
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiError("DELETE /api/despesas/[id]", async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteDespesa(ctx.wedding.id, id);
  return NextResponse.json({ ok: true });
});
