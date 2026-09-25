"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Phone, Globe } from "lucide-react";
import FornecedorFormModal, { type FornecedorFormValues } from "./FornecedorFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatBRL } from "@/lib/finance/money";
import { fetchOrToast } from "@/lib/utils/apiFetch";

export interface FornecedorRowComputed extends FornecedorFormValues {
  id: string;
  valorContratadoCents: number;
  valorPagoCents: number;
  valorPendenteCents: number;
}

export default function FornecedoresClient({ fornecedores }: { fornecedores: FornecedorRowComputed[] }) {
  const router = useRouter();
  const search = useSearchParams();
  const [modalOpen, setModalOpen] = useState(search.get("novo") === "1");
  const [editing, setEditing] = useState<FornecedorFormValues | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = fornecedores.filter((f) => !filter || f.nome.toLowerCase().includes(filter.toLowerCase()));

  function refresh() {
    router.refresh();
  }

  async function confirmDelete() {
    if (!deletingId) return;
    const res = await fetchOrToast(`/api/fornecedores/${deletingId}`, { method: "DELETE" }, "Erro ao excluir fornecedor");
    setDeletingId(null);
    if (!res) return;
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input className="input sm:max-w-xs" placeholder="Buscar fornecedor..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="flex gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/export/fornecedores" className="btn-secondary">
            Exportar CSV
          </a>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo fornecedor
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => (
          <div key={f.id} className="card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/fornecedores/${f.id}`} className="font-medium hover:text-accent">
                  {f.nome}
                </Link>
                <p className="text-xs text-muted">{f.categoria}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(f);
                    setModalOpen(true);
                  }}
                  className="p-1.5 hover:bg-champagne/20 rounded"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeletingId(f.id)} className="p-1.5 hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5 text-danger" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {f.telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {f.telefone}
                </span>
              )}
              {f.instagram && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {f.instagram}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 text-xs pt-2 border-t border-border">
              <div>
                <p className="text-muted">Contratado</p>
                <p className="font-medium">{formatBRL(f.valorContratadoCents)}</p>
              </div>
              <div>
                <p className="text-muted">Pago</p>
                <p className="font-medium text-success">{formatBRL(f.valorPagoCents)}</p>
              </div>
              <div>
                <p className="text-muted">Pendente</p>
                <p className="font-medium text-warning">{formatBRL(f.valorPendenteCents)}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted py-8 col-span-full">Nenhum fornecedor cadastrado.</p>}
      </div>

      <FornecedorFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={refresh} initial={editing} />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Excluir fornecedor"
        confirmLabel="Excluir"
        message="Tem certeza que deseja excluir este fornecedor? As despesas vinculadas continuarão existindo, mas sem fornecedor associado."
      />
    </div>
  );
}
