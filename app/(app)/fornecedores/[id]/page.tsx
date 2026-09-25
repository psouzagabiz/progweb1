export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireUserAndWedding } from "@/lib/auth/session";
import { getFornecedor, computeParcelasComputed } from "@/lib/db/repo";
import { formatBRL } from "@/lib/finance/money";
import { formatDateBR } from "@/lib/utils/dates";
import StatusBadge from "@/components/ui/StatusBadge";
import { ArrowLeft, Phone, Mail, Globe } from "lucide-react";

export default async function FornecedorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const { id } = await params;
  const fornecedor = getFornecedor(ctx.wedding.id, id);
  if (!fornecedor) notFound();

  const parcelas = computeParcelasComputed(ctx.wedding.id).filter((p) => p.fornecedor_id === id);
  const despesasIds = Array.from(new Set(parcelas.map((p) => p.despesa_id)));
  const contratado = parcelas.filter((p) => p.status !== "cancelado").reduce((s, p) => s + p.valorCents, 0);
  const pago = parcelas.reduce((s, p) => s + p.pagoCents, 0);
  const pendente = parcelas.filter((p) => p.status !== "cancelado").reduce((s, p) => s + p.restanteCents, 0);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/fornecedores" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground w-fit">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">{fornecedor.nome}</h1>
        <p className="text-muted text-sm mt-1">{fornecedor.categoria}</p>
      </div>

      <div className="card p-5 flex flex-wrap gap-6 text-sm">
        {fornecedor.telefone && (
          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted" /> {fornecedor.telefone}
          </span>
        )}
        {fornecedor.email && (
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted" /> {fornecedor.email}
          </span>
        )}
        {fornecedor.instagram && (
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted" /> {fornecedor.instagram}
          </span>
        )}
        {fornecedor.observacoes && <p className="w-full text-muted">{fornecedor.observacoes}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-muted">Contratado</p>
          <p className="text-lg font-semibold">{formatBRL(contratado)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Pago</p>
          <p className="text-lg font-semibold text-success">{formatBRL(pago)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Pendente</p>
          <p className="text-lg font-semibold text-warning">{formatBRL(pendente)}</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-medium mb-3">Despesas e parcelas vinculadas ({despesasIds.length} despesa(s))</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b border-border">
              <tr>
                <th className="py-2 pr-3 font-medium">Despesa</th>
                <th className="py-2 pr-3 font-medium">Parcela</th>
                <th className="py-2 pr-3 font-medium">Vencimento</th>
                <th className="py-2 pr-3 font-medium text-right">Valor</th>
                <th className="py-2 pr-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parcelas.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-3">{p.despesa_nome}</td>
                  <td className="py-2 pr-3">{p.label || p.numero}</td>
                  <td className="py-2 pr-3">{formatDateBR(p.vencimento)}</td>
                  <td className="py-2 pr-3 text-right">{formatBRL(p.valorCents)}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
              {parcelas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    Nenhuma despesa vinculada a este fornecedor ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
