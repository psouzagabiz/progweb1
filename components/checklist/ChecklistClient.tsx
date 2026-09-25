"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatDateBR } from "@/lib/utils/dates";
import { CHECKLIST_STATUS_LABELS } from "@/lib/finance/constants";
import { cn } from "@/lib/utils/cn";
import { fetchOrToast } from "@/lib/utils/apiFetch";

export interface ChecklistItem {
  id: string;
  nome: string;
  prazo: string | null;
  responsavel: string;
  status: "pendente" | "em_andamento" | "concluido";
  observacao: string;
}

const empty: Omit<ChecklistItem, "id"> = { nome: "", prazo: null, responsavel: "", status: "pendente", observacao: "" };

export default function ChecklistClient({ items }: { items: ChecklistItem[] }) {
  const router = useRouter();
  const search = useSearchParams();
  const [modalOpen, setModalOpen] = useState(search.get("novo") === "1");
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [values, setValues] = useState<Omit<ChecklistItem, "id">>(empty);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function refresh() {
    router.refresh();
  }

  function openNew() {
    setEditing(null);
    setValues(empty);
    setModalOpen(true);
  }

  function openEdit(item: ChecklistItem) {
    setEditing(item);
    setValues(item);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/checklist/${editing.id}` : "/api/checklist";
    const method = editing ? "PUT" : "POST";
    const res = await fetchOrToast(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }, "Erro ao salvar tarefa");
    setSaving(false);
    if (!res) return;
    setModalOpen(false);
    refresh();
  }

  async function toggleDone(item: ChecklistItem) {
    const newStatus = item.status === "concluido" ? "pendente" : "concluido";
    const res = await fetchOrToast(
      `/api/checklist/${item.id}`,
      { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, status: newStatus }) },
      "Erro ao atualizar tarefa"
    );
    if (!res) return;
    refresh();
  }

  async function confirmDelete() {
    if (!deletingId) return;
    const res = await fetchOrToast(`/api/checklist/${deletingId}`, { method: "DELETE" }, "Erro ao excluir tarefa");
    setDeletingId(null);
    if (!res) return;
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova tarefa
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className={cn("card p-4 flex items-center gap-3", item.status === "concluido" && "opacity-60")}>
            <button onClick={() => toggleDone(item)} aria-label="Concluir">
              {item.status === "concluido" ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Circle className="w-5 h-5 text-muted" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium", item.status === "concluido" && "line-through")}>{item.nome}</p>
              <p className="text-xs text-muted">
                {item.prazo ? `Prazo: ${formatDateBR(item.prazo)}` : "Sem prazo"} {item.responsavel && `· ${item.responsavel}`} ·{" "}
                {CHECKLIST_STATUS_LABELS[item.status]}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-champagne/20 rounded">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setDeletingId(item.id)} className="p-1.5 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4 text-danger" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-muted py-8">Nenhuma tarefa cadastrada.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar tarefa" : "Nova tarefa"} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nome da tarefa">
            <input required className="input" value={values.nome} onChange={(e) => setValues((v) => ({ ...v, nome: e.target.value }))} />
          </Field>
          <Field label="Prazo">
            <input type="date" className="input" value={values.prazo ?? ""} onChange={(e) => setValues((v) => ({ ...v, prazo: e.target.value || null }))} />
          </Field>
          <Field label="Responsável">
            <input className="input" value={values.responsavel} onChange={(e) => setValues((v) => ({ ...v, responsavel: e.target.value }))} />
          </Field>
          <Field label="Status">
            <select className="input" value={values.status} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as ChecklistItem["status"] }))}>
              {Object.entries(CHECKLIST_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observação">
            <textarea className="input min-h-16" value={values.observacao} onChange={(e) => setValues((v) => ({ ...v, observacao: e.target.value }))} />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Excluir tarefa"
        confirmLabel="Excluir"
        message="Tem certeza que deseja excluir esta tarefa?"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
