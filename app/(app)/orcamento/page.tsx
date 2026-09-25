export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { computeParcelasComputed, listCategoriaOrcamentos } from "@/lib/db/repo";
import { computeDashboardTotals } from "@/lib/finance/totals";
import OrcamentoForm from "@/components/orcamento/OrcamentoForm";

export default async function OrcamentoPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const { wedding } = ctx;
  const categorias = await listCategoriaOrcamentos(wedding.id);
  const parcelas = await computeParcelasComputed(wedding.id);
  const totals = computeDashboardTotals(parcelas, wedding.orcamento_maximo_cents);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Orçamento</h1>
        <p className="text-muted text-sm mt-1">Defina o orçamento geral e por categoria do casamento.</p>
      </div>
      <OrcamentoForm
        wedding={wedding}
        categorias={categorias}
        percentComprometido={totals.percentComprometido}
        totalContratado={totals.valorTotalCasamento}
      />
    </div>
  );
}
