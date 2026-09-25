"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { parseBRLToCents } from "@/lib/finance/money";
import { FORMAS_PAGAMENTO } from "@/lib/finance/constants";

export default function RegistrarPagamentoModal({
  open,
  onClose,
  onSaved,
  parcelaId,
  valorRestanteCents,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  parcelaId: string | null;
  valorRestanteCents: number;
}) {
  const [valor, setValor] = useState((valorRestanteCents / 100).toFixed(2).replace(".", ","));
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState("PIX");
  const [conta, setConta] = useState("");
  const [observacao, setObservacao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!parcelaId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData();
    form.set("valor_pago_cents", String(parseBRLToCents(valor)));
    form.set("data_pagamento", dataPagamento);
    form.set("forma_pagamento", forma);
    form.set("conta_cartao", conta);
    form.set("observacao", observacao);
    if (file) form.set("comprovante", file);
    await fetch(`/api/parcelas/${parcelaId}/pagamentos`, { method: "POST", body: form });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar pagamento" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Valor pago (R$)">
          <input required className="input" value={valor} onChange={(e) => setValor(e.target.value)} />
        </Field>
        <Field label="Data do pagamento">
          <input
            type="date"
            required
            className="input"
            value={dataPagamento}
            onChange={(e) => setDataPagamento(e.target.value)}
          />
        </Field>
        <Field label="Forma de pagamento">
          <select className="input" value={forma} onChange={(e) => setForma(e.target.value)}>
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Conta/cartão utilizado">
          <input className="input" value={conta} onChange={(e) => setConta(e.target.value)} placeholder="Ex: Nubank, Itaú..." />
        </Field>
        <Field label="Comprovante (opcional)">
          <input type="file" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="Observação">
          <textarea className="input min-h-16" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Registrando..." : "Registrar pagamento"}
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
