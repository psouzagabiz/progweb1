"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DespesaFormModal, { type DespesaFormValues } from "./DespesaFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatBRL } from "@/lib/finance/money";
import { formatDateBR } from "@/lib/utils/dates";

interface DespesaRow extends DespesaFormValues {
  id: string;
}

export default function DespesasClient({
  despesas,
  fornecedores,
}: {
  despesas: DespesaRow[];
  fornecedores: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [modalOpen, setModalOpen] = useState(search.get("novo") === "1");
  const [editing, setEditing] = useState<DespesaFormValues | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [impact, setImpact] = useState<{ numParcelas: number; numPagamentos: number } | null>(null);
  const [filter, setFilter] = useState("");

  const fornecedorMap = useMemo(() => new Map(fornecedores.map((f) => [f.id, f.nome])), [fornecedores]);

  const filtered = despesas.filter(
    (d) => !filter || d.nome.toLowerCase().includes(filter.toLowerCase()) || d.categoria.toLowerCase().includes(filter.toLowerCase())
  );

  function refresh() {
    router.refresh();
  }

  async function openDelete(id: string) {
    const res = await fetch(`/api/despesas/${id}`);
    const data = await res.json();
    setImpact(data.impact);
    setDeletingId(id);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    await fetch(`/api/despesas/${deletingId}`, { method: "DELETE" });
    setDeletingId(null);
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          className="input sm:max-w-xs"
          placeholder="Buscar despesa ou categoria..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4" /> Nova despesa
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-champagne/10 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Contratação</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium">Forma</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium">{d.nome}</td>
                <td className="px-4 py-3">{d.categoria}</td>
                <td className="px-4 py-3">{d.fornecedor_id ? fornecedorMap.get(d.fornecedor_id) ?? "-" : "-"}</td>
                <td className="px-4 py-3">{formatDateBR(d.data_contratacao)}</td>
                <td className="px-4 py-3 text-right">{formatBRL(d.valor_total_cents)}</td>
                <td className="px-4 py-3 capitalize">{d.tipo_pagamento.replace("_", " + ")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(d);
                        setModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-champagne/20 rounded"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => openDelete(d.id)} className="p-1.5 hover:bg-red-50 rounded" aria-label="Excluir">
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Nenhuma despesa cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.map((d) => (
          <div key={d.id} className="card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{d.nome}</p>
                <p className="text-xs text-muted">{d.categoria}</p>
              </div>
              <p className="font-semibold">{formatBRL(d.valor_total_cents)}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{formatDateBR(d.data_contratacao)}</span>
              <span className="capitalize">{d.tipo_pagamento.replace("_", " + ")}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setEditing(d);
                  setModalOpen(true);
                }}
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => openDelete(d.id)} className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2 text-danger">
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted py-8">Nenhuma despesa cadastrada.</p>}
      </div>

      <DespesaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        fornecedores={fornecedores}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Excluir despesa"
        confirmLabel="Excluir"
        message={
          impact && (impact.numParcelas > 0 || impact.numPagamentos > 0)
            ? `Esta despesa possui ${impact.numParcelas} parcela(s) e ${impact.numPagamentos} pagamento(s) registrados. Excluir a despesa também excluirá todas as parcelas e pagamentos vinculados. Deseja continuar?`
            : "Tem certeza que deseja excluir esta despesa?"
        }
      />
    </div>
  );
}
