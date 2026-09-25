import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { deleteFornecedor, getFornecedor, updateFornecedor } from "@/lib/db/repo";
import { withApiError } from "@/lib/api/errors";

export const GET = withApiError("GET /api/fornecedores/[id]", async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const f = await getFornecedor(ctx.wedding.id, id);
  if (!f) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(f);
});

export const PUT = withApiError("PUT /api/fornecedores/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await updateFornecedor(ctx.wedding.id, id, {
    nome: body.nome ?? "",
    categoria: body.categoria ?? "",
    telefone: body.telefone ?? "",
    whatsapp: body.whatsapp ?? "",
    email: body.email ?? "",
    instagram: body.instagram ?? "",
    observacoes: body.observacoes ?? "",
  });
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiError("DELETE /api/fornecedores/[id]", async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteFornecedor(ctx.wedding.id, id);
  return NextResponse.json({ ok: true });
});
