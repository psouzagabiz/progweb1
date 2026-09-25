"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { CATEGORIAS_DESPESA } from "@/lib/finance/constants";

export interface FornecedorFormValues {
  id?: string;
  nome: string;
  categoria: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  observacoes: string;
}

const empty: FornecedorFormValues = {
  nome: "",
  categoria: CATEGORIAS_DESPESA[0],
  telefone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  observacoes: "",
};

export default function FornecedorFormModal({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: FornecedorFormValues | null;
}) {
  const [values, setValues] = useState<FornecedorFormValues>(initial ?? empty);
  const [lastId, setLastId] = useState<string | undefined>(initial?.id);
  const [saving, setSaving] = useState(false);

  if (open && initial?.id !== lastId) {
    setLastId(initial?.id);
    setValues(initial ?? empty);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = values.id ? `/api/fornecedores/${values.id}` : "/api/fornecedores";
    const method = values.id ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!res.ok) {
        toast.error(`Erro ao salvar fornecedor: ${await res.text()}`);
        return;
      }
      toast.success(values.id ? "Fornecedor atualizado" : "Fornecedor criado");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(`Erro ao salvar fornecedor: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={values.id ? "Editar fornecedor" : "Novo fornecedor"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nome">
          <input required className="input" value={values.nome} onChange={(e) => setValues((v) => ({ ...v, nome: e.target.value }))} />
        </Field>
        <Field label="Categoria">
          <select className="input" value={values.categoria} onChange={(e) => setValues((v) => ({ ...v, categoria: e.target.value }))}>
            {CATEGORIAS_DESPESA.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Telefone">
            <input className="input" value={values.telefone} onChange={(e) => setValues((v) => ({ ...v, telefone: e.target.value }))} />
          </Field>
          <Field label="WhatsApp">
            <input className="input" value={values.whatsapp} onChange={(e) => setValues((v) => ({ ...v, whatsapp: e.target.value }))} />
          </Field>
          <Field label="E-mail">
            <input type="email" className="input" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} />
          </Field>
          <Field label="Instagram / Site">
            <input className="input" value={values.instagram} onChange={(e) => setValues((v) => ({ ...v, instagram: e.target.value }))} />
          </Field>
        </div>
        <Field label="Observações">
          <textarea
            className="input min-h-16"
            value={values.observacoes}
            onChange={(e) => setValues((v) => ({ ...v, observacoes: e.target.value }))}
          />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
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
