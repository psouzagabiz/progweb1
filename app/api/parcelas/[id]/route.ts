import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { getParcelaWithContext, listPagamentosForParcela, updateParcela } from "@/lib/db/repo";
import { withApiError } from "@/lib/api/errors";

export const GET = withApiError("GET /api/parcelas/[id]", async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const p = await getParcelaWithContext(ctx.wedding.id, id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  const pagamentos = await listPagamentosForParcela(id);
  return NextResponse.json({ ...p, pagamentos });
});

export const PUT = withApiError("PUT /api/parcelas/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await updateParcela(ctx.wedding.id, id, {
    valor_cents: body.valor_cents !== undefined ? Number(body.valor_cents) : undefined,
    vencimento: body.vencimento,
    forma_pagamento: body.forma_pagamento,
    observacao: body.observacao,
    cancelada: body.cancelada,
  });
  return NextResponse.json({ ok: true });
});
