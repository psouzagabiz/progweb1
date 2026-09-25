import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import {
  computeParcelasComputed,
  listFornecedores,
  listPagamentosForWedding,
  listParcelasForWedding,
} from "@/lib/db/repo";
import { toCsv } from "@/lib/reports/csv";
import { formatBRL } from "@/lib/finance/money";
import { formatDateBR } from "@/lib/utils/dates";
import { STATUS_LABELS } from "@/lib/finance/constants";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { tipo } = await params;
  const weddingId = ctx.wedding.id;

  let csv = "";
  let filename = "export.csv";

  if (tipo === "parcelas") {
    const parcelas = await computeParcelasComputed(weddingId);
    csv = toCsv(
      parcelas.map((p) => ({
        despesa: p.despesa_nome,
        categoria: p.despesa_categoria,
        numero: p.numero,
        vencimento: formatDateBR(p.vencimento),
        valor: formatBRL(p.valorCents),
        pago: formatBRL(p.pagoCents),
        restante: formatBRL(p.restanteCents),
        status: STATUS_LABELS[p.status] ?? p.status,
      })),
      [
        { key: "despesa", label: "Despesa" },
        { key: "categoria", label: "Categoria" },
        { key: "numero", label: "Parcela" },
        { key: "vencimento", label: "Vencimento" },
        { key: "valor", label: "Valor" },
        { key: "pago", label: "Pago" },
        { key: "restante", label: "Restante" },
        { key: "status", label: "Status" },
      ]
    );
    filename = "parcelas.csv";
  } else if (tipo === "pagamentos") {
    const pagamentos = await listPagamentosForWedding(weddingId);
    const parcelasCtx = await listParcelasForWedding(weddingId);
    const byId = new Map(parcelasCtx.map((p) => [p.id, p]));
    csv = toCsv(
      pagamentos.map((pg) => {
        const p = byId.get(pg.parcela_id);
        return {
          despesa: p?.despesa_nome ?? "",
          data_pagamento: formatDateBR(pg.data_pagamento),
          valor_pago: formatBRL(pg.valor_pago_cents),
          forma_pagamento: pg.forma_pagamento,
          conta_cartao: pg.conta_cartao,
          observacao: pg.observacao,
        };
      }),
      [
        { key: "despesa", label: "Despesa" },
        { key: "data_pagamento", label: "Data do pagamento" },
        { key: "valor_pago", label: "Valor pago" },
        { key: "forma_pagamento", label: "Forma de pagamento" },
        { key: "conta_cartao", label: "Conta/cartão" },
        { key: "observacao", label: "Observação" },
      ]
    );
    filename = "pagamentos.csv";
  } else if (tipo === "fornecedores") {
    const fornecedores = await listFornecedores(weddingId);
    csv = toCsv(
      fornecedores.map((f) => ({
        nome: f.nome,
        categoria: f.categoria,
        telefone: f.telefone,
        whatsapp: f.whatsapp,
        email: f.email,
        instagram: f.instagram,
      })),
      [
        { key: "nome", label: "Nome" },
        { key: "categoria", label: "Categoria" },
        { key: "telefone", label: "Telefone" },
        { key: "whatsapp", label: "WhatsApp" },
        { key: "email", label: "E-mail" },
        { key: "instagram", label: "Instagram/Site" },
      ]
    );
    filename = "fornecedores.csv";
  } else {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
