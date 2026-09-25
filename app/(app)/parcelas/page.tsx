export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { computeParcelasComputed } from "@/lib/db/repo";
import ParcelasClient from "@/components/parcelas/ParcelasClient";

export default async function ParcelasPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const parcelas = computeParcelasComputed(ctx.wedding.id).map((p) => ({
    id: p.id,
    despesa_nome: p.despesa_nome,
    despesa_categoria: p.despesa_categoria,
    numero: p.numero,
    label: p.label,
    valorCents: p.valorCents,
    vencimento: p.vencimento,
    status: p.status,
    pagoCents: p.pagoCents,
    restanteCents: p.restanteCents,
    forma_pagamento: p.forma_pagamento,
    observacao: p.observacao,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Parcelas</h1>
        <p className="text-muted text-sm mt-1">Acompanhe e registre pagamentos de todas as parcelas.</p>
      </div>
      <ParcelasClient parcelas={parcelas} />
    </div>
  );
}
