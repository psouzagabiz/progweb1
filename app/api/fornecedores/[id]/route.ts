import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { deleteFornecedor, getFornecedor, updateFornecedor } from "@/lib/db/repo";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const f = getFornecedor(ctx.wedding.id, id);
  if (!f) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(f);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  updateFornecedor(ctx.wedding.id, id, {
    nome: body.nome ?? "",
    categoria: body.categoria ?? "",
    telefone: body.telefone ?? "",
    whatsapp: body.whatsapp ?? "",
    email: body.email ?? "",
    instagram: body.instagram ?? "",
    observacoes: body.observacoes ?? "",
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  deleteFornecedor(ctx.wedding.id, id);
  return NextResponse.json({ ok: true });
}
