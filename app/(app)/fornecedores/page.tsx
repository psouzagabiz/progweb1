export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { listFornecedores, computeParcelasComputed } from "@/lib/db/repo";
import FornecedoresClient from "@/components/fornecedores/FornecedoresClient";

export default async function FornecedoresPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");

  const fornecedores = await listFornecedores(ctx.wedding.id);
  const parcelas = await computeParcelasComputed(ctx.wedding.id);

  const computed = fornecedores.map((f) => {
    const relacionadas = parcelas.filter((p) => p.fornecedor_id === f.id && p.status !== "cancelado");
    const valorContratadoCents = relacionadas.reduce((s, p) => s + p.valorCents, 0);
    const valorPagoCents = relacionadas.reduce((s, p) => s + p.pagoCents, 0);
    const valorPendenteCents = relacionadas.reduce((s, p) => s + p.restanteCents, 0);
    return {
      id: f.id,
      nome: f.nome,
      categoria: f.categoria,
      telefone: f.telefone,
      whatsapp: f.whatsapp,
      email: f.email,
      instagram: f.instagram,
      observacoes: f.observacoes,
      valorContratadoCents,
      valorPagoCents,
      valorPendenteCents,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Fornecedores</h1>
        <p className="text-muted text-sm mt-1">Contatos e valores contratados com cada fornecedor.</p>
      </div>
      <FornecedoresClient fornecedores={computed} />
    </div>
  );
}
