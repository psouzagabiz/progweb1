export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { listParcelasForWedding, listPagamentosForWedding } from "@/lib/db/repo";
import PagamentosClient from "@/components/pagamentos/PagamentosClient";

export default async function PagamentosPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const parcelas = await listParcelasForWedding(ctx.wedding.id);
  const byId = new Map(parcelas.map((p) => [p.id, p]));
  const pagamentos = (await listPagamentosForWedding(ctx.wedding.id)).map((p) => ({
    id: p.id,
    despesa_nome: byId.get(p.parcela_id)?.despesa_nome ?? "-",
    data_pagamento: p.data_pagamento,
    valor_pago_cents: p.valor_pago_cents,
    forma_pagamento: p.forma_pagamento,
    conta_cartao: p.conta_cartao,
    observacao: p.observacao,
    comprovante_path: p.comprovante_path,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Pagamentos</h1>
        <p className="text-muted text-sm mt-1">Lista completa de pagamentos registrados.</p>
      </div>
      <PagamentosClient pagamentos={pagamentos} />
    </div>
  );
}
