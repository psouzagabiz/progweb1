"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { parseBRLToCents } from "@/lib/finance/money";
import { CATEGORIAS_DESPESA, TIPOS_PAGAMENTO, PERIODICIDADES } from "@/lib/finance/constants";

export interface DespesaFormValues {
  id?: string;
  fornecedor_id: string | null;
  nome: string;
  categoria: string;
  descricao: string;
  data_contratacao: string;
  valor_total_cents: number;
  tipo_pagamento: string;
  num_parcelas: number;
  valor_entrada_cents: number;
  periodicidade: string;
  intervalo_dias: number;
  cartao: string;
  data_primeira_fatura: string | null;
  observacoes: string;
}

const empty: DespesaFormValues = {
  fornecedor_id: null,
  nome: "",
  categoria: CATEGORIAS_DESPESA[0],
  descricao: "",
  data_contratacao: new Date().toISOString().slice(0, 10),
  valor_total_cents: 0,
  tipo_pagamento: "avista",
  num_parcelas: 1,
  valor_entrada_cents: 0,
  periodicidade: "mensal",
  intervalo_dias: 30,
  cartao: "",
  data_primeira_fatura: null,
  observacoes: "",
};

export default function DespesaFormModal({
  open,
  onClose,
  onSaved,
  fornecedores,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  fornecedores: { id: string; nome: string }[];
  initial?: DespesaFormValues | null;
}) {
  const [values, setValues] = useState<DespesaFormValues>(initial ?? empty);
  const [valorTotalStr, setValorTotalStr] = useState(initial ? (initial.valor_total_cents / 100).toFixed(2).replace(".", ",") : "");
  const [valorEntradaStr, setValorEntradaStr] = useState(
    initial ? (initial.valor_entrada_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [saving, setSaving] = useState(false);
  const [customCategoria, setCustomCategoria] = useState(false);

  // Reset form when opening for a different item
  const [lastId, setLastId] = useState<string | undefined>(initial?.id);
  if (open && initial?.id !== lastId) {
    setLastId(initial?.id);
    setValues(initial ?? empty);
    setValorTotalStr(initial ? (initial.valor_total_cents / 100).toFixed(2).replace(".", ",") : "");
    setValorEntradaStr(initial ? (initial.valor_entrada_cents / 100).toFixed(2).replace(".", ",") : "");
  }

  const valorTotalCents = parseBRLToCents(valorTotalStr);
  const valorEntradaCents = parseBRLToCents(valorEntradaStr);
  const restante = Math.max(0, valorTotalCents - (values.tipo_pagamento === "entrada_parcelas" ? valorEntradaCents : 0));
  const valorParcela =
    values.tipo_pagamento === "parcelado" || values.tipo_pagamento === "entrada_parcelas"
      ? values.num_parcelas > 0
        ? Math.floor(restante / values.num_parcelas) / 100
        : 0
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...values,
      valor_total_cents: valorTotalCents,
      valor_entrada_cents: valorEntradaCents,
    };
    const url = values.id ? `/api/despesas/${values.id}` : "/api/despesas";
    const method = values.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      alert(`Erro ao salvar despesa: ${await res.text()}`);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={values.id ? "Editar despesa" : "Nova despesa"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome da despesa">
            <input
              required
              className="input"
              value={values.nome}
              onChange={(e) => setValues((v) => ({ ...v, nome: e.target.value }))}
            />
          </Field>
          <Field label="Categoria">
            {!customCategoria ? (
              <select
                className="input"
                value={values.categoria}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setCustomCategoria(true);
                    setValues((v) => ({ ...v, categoria: "" }));
                  } else {
                    setValues((v) => ({ ...v, categoria: e.target.value }));
                  }
                }}
              >
                {CATEGORIAS_DESPESA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">Outra (personalizada)...</option>
              </select>
            ) : (
              <input
                className="input"
                placeholder="Digite a categoria"
                value={values.categoria}
                onChange={(e) => setValues((v) => ({ ...v, categoria: e.target.value }))}
              />
            )}
          </Field>
          <Field label="Fornecedor">
            <select
              className="input"
              value={values.fornecedor_id ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, fornecedor_id: e.target.value || null }))}
            >
              <option value="">Nenhum</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data de contratação">
            <input
              type="date"
              required
              className="input"
              value={values.data_contratacao}
              onChange={(e) => setValues((v) => ({ ...v, data_contratacao: e.target.value }))}
            />
          </Field>
          <Field label="Valor total (R$)">
            <input
              required
              className="input"
              placeholder="0,00"
              value={valorTotalStr}
              onChange={(e) => setValorTotalStr(e.target.value)}
            />
          </Field>
          <Field label="Forma de contratação">
            <select
              className="input"
              value={values.tipo_pagamento}
              onChange={(e) => setValues((v) => ({ ...v, tipo_pagamento: e.target.value }))}
            >
              {TIPOS_PAGAMENTO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {(values.tipo_pagamento === "parcelado" ||
          values.tipo_pagamento === "entrada_parcelas" ||
          values.tipo_pagamento === "recorrente") && (
          <div className="grid sm:grid-cols-3 gap-4 p-3 rounded-lg bg-champagne/10 border border-border">
            {values.tipo_pagamento === "entrada_parcelas" && (
              <Field label="Valor da entrada (R$)">
                <input
                  className="input"
                  placeholder="0,00"
                  value={valorEntradaStr}
                  onChange={(e) => setValorEntradaStr(e.target.value)}
                />
              </Field>
            )}
            <Field label="Número de parcelas">
              <input
                type="number"
                min={1}
                className="input"
                value={values.num_parcelas}
                onChange={(e) => setValues((v) => ({ ...v, num_parcelas: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Periodicidade">
              <select
                className="input"
                value={values.periodicidade}
                onChange={(e) => setValues((v) => ({ ...v, periodicidade: e.target.value }))}
              >
                {PERIODICIDADES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            {values.periodicidade === "personalizada" && (
              <Field label="Intervalo (dias)">
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={values.intervalo_dias}
                  onChange={(e) => setValues((v) => ({ ...v, intervalo_dias: Number(e.target.value) }))}
                />
              </Field>
            )}
            {(values.tipo_pagamento === "parcelado" || values.tipo_pagamento === "entrada_parcelas") && (
              <p className="text-xs text-muted sm:col-span-3">
                Cada parcela será de aproximadamente{" "}
                <strong>
                  {valorParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </strong>{" "}
                (o arredondamento é ajustado na última parcela para que a soma seja exatamente o valor total).
              </p>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Cartão utilizado (opcional)">
            <input className="input" value={values.cartao} onChange={(e) => setValues((v) => ({ ...v, cartao: e.target.value }))} />
          </Field>
          <Field label="Data da 1ª fatura (opcional)">
            <input
              type="date"
              className="input"
              value={values.data_primeira_fatura ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, data_primeira_fatura: e.target.value || null }))}
            />
          </Field>
        </div>

        <Field label="Descrição">
          <textarea className="input min-h-16" value={values.descricao} onChange={(e) => setValues((v) => ({ ...v, descricao: e.target.value }))} />
        </Field>
        <Field label="Observações">
          <textarea
            className="input min-h-16"
            value={values.observacoes}
            onChange={(e) => setValues((v) => ({ ...v, observacoes: e.target.value }))}
          />
        </Field>

        {values.id && (
          <p className="text-xs text-warning">
            Atenção: alterar valor, entrada, nº de parcelas ou periodicidade regenera todas as parcelas desta despesa
            (pagamentos já registrados em parcelas antigas serão perdidos).
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Salvando..." : "Salvar despesa"}
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
