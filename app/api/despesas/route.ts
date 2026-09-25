import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { createDespesa, listDespesas, type DespesaInput } from "@/lib/db/repo";

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

export async function GET() {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(listDespesas(ctx.wedding.id));
}

export async function POST(req: NextRequest) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = createDespesa(ctx.wedding.id, parseInput(body));
  return NextResponse.json({ id });
}
