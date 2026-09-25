import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { createFornecedor, listFornecedores } from "@/lib/db/repo";

export async function GET() {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await listFornecedores(ctx.wedding.id));
}

export async function POST(req: NextRequest) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const id = await createFornecedor(ctx.wedding.id, {
      nome: body.nome ?? "",
      categoria: body.categoria ?? "",
      telefone: body.telefone ?? "",
      whatsapp: body.whatsapp ?? "",
      email: body.email ?? "",
      instagram: body.instagram ?? "",
      observacoes: body.observacoes ?? "",
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/fornecedores failed", err);
    return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
}
