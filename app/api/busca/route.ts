import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { listDespesas, listFornecedores, listParcelasForWedding } from "@/lib/db/repo";

export async function GET(req: NextRequest) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = (req.nextUrl.searchParams.get("q") || "").toLowerCase().trim();
  if (!q) return NextResponse.json({ fornecedores: [], despesas: [], parcelas: [] });

  const fornecedores = listFornecedores(ctx.wedding.id)
    .filter((f) => f.nome.toLowerCase().includes(q) || f.categoria.toLowerCase().includes(q))
    .map((f) => ({ id: f.id, nome: f.nome, categoria: f.categoria }));

  const despesas = listDespesas(ctx.wedding.id)
    .filter((d) => d.nome.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q))
    .map((d) => ({ id: d.id, nome: d.nome, categoria: d.categoria }));

  const parcelas = listParcelasForWedding(ctx.wedding.id)
    .filter((p) => p.despesa_nome.toLowerCase().includes(q) || String(p.numero).includes(q) || p.despesa_categoria.toLowerCase().includes(q))
    .slice(0, 30)
    .map((p) => ({ id: p.id, despesa_nome: p.despesa_nome, numero: p.numero, vencimento: p.vencimento }));

  return NextResponse.json({ fornecedores, despesas, parcelas });
}
