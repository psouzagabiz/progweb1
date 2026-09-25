"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Ban } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import RegistrarPagamentoModal from "./RegistrarPagamentoModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatBRL } from "@/lib/finance/money";
import { formatDateBR } from "@/lib/utils/dates";
import { STATUS_LABELS } from "@/lib/finance/constants";
import { cn } from "@/lib/utils/cn";
import { fetchOrToast } from "@/lib/utils/apiFetch";

export interface ParcelaComputedRow {
  id: string;
  despesa_nome: string;
  despesa_categoria: string;
  numero: number;
  label: string;
  valorCents: number;
  vencimento: string;
  status: string;
  pagoCents: number;
  restanteCents: number;
  forma_pagamento: string;
  observacao: string;
}

export default function ParcelasClient({ parcelas }: { parcelas: ParcelaComputedRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [search, setSearch] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payingRestante, setPayingRestante] = useState(0);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const categorias = useMemo(() => Array.from(new Set(parcelas.map((p) => p.despesa_categoria))), [parcelas]);

  const filtered = parcelas.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (categoriaFilter && p.despesa_categoria !== categoriaFilter) return false;
    if (search && !p.despesa_nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function refresh() {
    router.refresh();
  }

  async function handleCancel() {
    if (!cancelingId) return;
    const res = await fetchOrToast(
      `/api/parcelas/${cancelingId}`,
      { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cancelada: true }) },
      "Erro ao cancelar parcela"
    );
    setCancelingId(null);
    if (!res) return;
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-[200px]" placeholder="Buscar despesa..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className="input max-w-[180px]" value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)}>
          <option value="">Todas categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-champagne/10 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Despesa</th>
              <th className="px-4 py-3 font-medium">Parcela</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium text-right">Pago</th>
              <th className="px-4 py-3 font-medium text-right">Restante</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className={cn(p.status === "vencido" && "bg-red-50/60")}>
                <td className="px-4 py-3 font-medium">{p.despesa_nome}</td>
                <td className="px-4 py-3">{p.label || `Parcela ${p.numero}`}</td>
                <td className="px-4 py-3">{formatDateBR(p.vencimento)}</td>
                <td className="px-4 py-3 text-right">{formatBRL(p.valorCents)}</td>
                <td className="px-4 py-3 text-right">{formatBRL(p.pagoCents)}</td>
                <td className="px-4 py-3 text-right">{formatBRL(p.restanteCents)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {p.status !== "pago" && p.status !== "cancelado" && (
                      <button
                        onClick={() => {
                          setPayingId(p.id);
                          setPayingRestante(p.restanteCents);
                        }}
                        className="p-1.5 hover:bg-champagne/20 rounded"
                        title="Registrar pagamento"
                      >
                        <CreditCard className="w-4 h-4 text-accent" />
                      </button>
                    )}
                    {p.status !== "cancelado" && p.status !== "pago" && (
                      <button onClick={() => setCancelingId(p.id)} className="p-1.5 hover:bg-red-50 rounded" title="Cancelar parcela">
                        <Ban className="w-4 h-4 text-danger" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  Nenhuma parcela encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.map((p) => (
          <div key={p.id} className={cn("card p-4 flex flex-col gap-2", p.status === "vencido" && "border-danger/40 bg-red-50/60")}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{p.despesa_nome}</p>
                <p className="text-xs text-muted">{p.label || `Parcela ${p.numero}`} · vence {formatDateBR(p.vencimento)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted">
              <span>Valor: <strong className="text-foreground">{formatBRL(p.valorCents)}</strong></span>
              <span>Pago: <strong className="text-foreground">{formatBRL(p.pagoCents)}</strong></span>
              <span>Falta: <strong className="text-foreground">{formatBRL(p.restanteCents)}</strong></span>
            </div>
            {p.status !== "pago" && p.status !== "cancelado" && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setPayingId(p.id);
                    setPayingRestante(p.restanteCents);
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pagar
                </button>
                <button onClick={() => setCancelingId(p.id)} className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2 text-danger">
                  <Ban className="w-3.5 h-3.5" /> Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted py-8">Nenhuma parcela encontrada.</p>}
      </div>

      <RegistrarPagamentoModal
        open={!!payingId}
        onClose={() => setPayingId(null)}
        onSaved={refresh}
        parcelaId={payingId}
        valorRestanteCents={payingRestante}
      />

      <ConfirmDialog
        open={!!cancelingId}
        onClose={() => setCancelingId(null)}
        onConfirm={handleCancel}
        title="Cancelar parcela"
        confirmLabel="Cancelar parcela"
        message="Tem certeza que deseja cancelar esta parcela? Ela deixará de contar nos totais em aberto."
      />
    </div>
  );
}
