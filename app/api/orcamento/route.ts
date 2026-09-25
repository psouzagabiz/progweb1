import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { listCategoriaOrcamentos, setCategoriaOrcamento, updateWedding } from "@/lib/db/repo";

export async function GET() {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    wedding: ctx.wedding,
    categorias: await listCategoriaOrcamentos(ctx.wedding.id),
  });
}

export async function PUT(req: NextRequest) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  await updateWedding(ctx.wedding.id, {
    noivo1: body.noivo1 ?? "",
    noivo2: body.noivo2 ?? "",
    data_casamento: body.data_casamento || null,
    orcamento_maximo_cents: Number(body.orcamento_maximo_cents) || 0,
    observacoes: body.observacoes ?? "",
  });
  if (Array.isArray(body.categorias)) {
    for (const c of body.categorias) {
      await setCategoriaOrcamento(ctx.wedding.id, c.categoria, Number(c.orcamento_cents) || 0);
    }
  }
  return NextResponse.json({ ok: true });
}
