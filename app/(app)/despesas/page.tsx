export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { listDespesas, listFornecedores } from "@/lib/db/repo";
import DespesasClient from "@/components/despesas/DespesasClient";

export default async function DespesasPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const despesas = listDespesas(ctx.wedding.id).map((d) => ({
    id: d.id,
    fornecedor_id: d.fornecedor_id,
    nome: d.nome,
    categoria: d.categoria,
    descricao: d.descricao,
    data_contratacao: d.data_contratacao,
    valor_total_cents: d.valor_total_cents,
    tipo_pagamento: d.tipo_pagamento,
    num_parcelas: d.num_parcelas,
    valor_entrada_cents: d.valor_entrada_cents,
    periodicidade: d.periodicidade,
    intervalo_dias: d.intervalo_dias,
    cartao: d.cartao,
    data_primeira_fatura: d.data_primeira_fatura,
    observacoes: d.observacoes,
  }));
  const fornecedores = listFornecedores(ctx.wedding.id).map((f) => ({ id: f.id, nome: f.nome }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Despesas</h1>
        <p className="text-muted text-sm mt-1">Cadastre e gerencie todas as despesas do casamento.</p>
      </div>
      <DespesasClient despesas={despesas} fornecedores={fornecedores} />
    </div>
  );
}
