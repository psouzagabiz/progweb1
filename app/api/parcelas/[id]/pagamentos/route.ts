import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { requireUserAndWedding } from "@/lib/auth/session";
import { registrarPagamento } from "@/lib/db/repo";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const contentType = req.headers.get("content-type") || "";
  let valor_pago_cents = 0;
  let data_pagamento = new Date().toISOString().slice(0, 10);
  let forma_pagamento = "PIX";
  let conta_cartao = "";
  let observacao = "";
  let comprovante_path: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    valor_pago_cents = Number(form.get("valor_pago_cents")) || 0;
    data_pagamento = (form.get("data_pagamento") as string) || data_pagamento;
    forma_pagamento = (form.get("forma_pagamento") as string) || forma_pagamento;
    conta_cartao = (form.get("conta_cartao") as string) || "";
    observacao = (form.get("observacao") as string) || "";
    const file = form.get("comprovante") as File | null;
    if (file && file.size > 0) {
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = path.extname(file.name) || "";
      const filename = `${randomUUID()}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      comprovante_path = filename;
    }
  } else {
    const body = await req.json();
    valor_pago_cents = Number(body.valor_pago_cents) || 0;
    data_pagamento = body.data_pagamento || data_pagamento;
    forma_pagamento = body.forma_pagamento || forma_pagamento;
    conta_cartao = body.conta_cartao || "";
    observacao = body.observacao || "";
  }

  const pagamentoId = registrarPagamento(ctx.wedding.id, id, {
    valor_pago_cents,
    data_pagamento,
    forma_pagamento,
    conta_cartao,
    observacao,
    comprovante_path,
  });

  return NextResponse.json({ id: pagamentoId });
}
