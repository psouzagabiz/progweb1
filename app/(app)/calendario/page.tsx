export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { computeParcelasComputed } from "@/lib/db/repo";
import CalendarioClient from "@/components/calendario/CalendarioClient";

export default async function CalendarioPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const parcelas = computeParcelasComputed(ctx.wedding.id)
    .filter((p) => p.status !== "cancelado")
    .map((p) => ({ id: p.id, despesa_nome: p.despesa_nome, vencimento: p.vencimento, valorCents: p.valorCents, status: p.status }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Calendário</h1>
        <p className="text-muted text-sm mt-1">Visualize os vencimentos por dia.</p>
      </div>
      <CalendarioClient parcelas={parcelas} />
    </div>
  );
}
