"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseBRLToCents, formatBRL } from "@/lib/finance/money";
import { CATEGORIAS_DESPESA } from "@/lib/finance/constants";
import { fetchOrToast } from "@/lib/utils/apiFetch";

interface Props {
  wedding: {
    noivo1: string;
    noivo2: string;
    data_casamento: string | null;
    orcamento_maximo_cents: number;
    observacoes: string;
  };
  categorias: { categoria: string; orcamento_cents: number }[];
  percentComprometido: number;
  totalContratado: number;
}

export default function OrcamentoForm({ wedding, categorias, percentComprometido, totalContratado }: Props) {
  const router = useRouter();
  const [noivo1, setNoivo1] = useState(wedding.noivo1);
  const [noivo2, setNoivo2] = useState(wedding.noivo2);
  const [dataCasamento, setDataCasamento] = useState(wedding.data_casamento ?? "");
  const [orcamento, setOrcamento] = useState(
    wedding.orcamento_maximo_cents ? (wedding.orcamento_maximo_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [observacoes, setObservacoes] = useState(wedding.observacoes);
  const [catValues, setCatValues] = useState<Record<string, string>>(
    Object.fromEntries(
      CATEGORIAS_DESPESA.map((c) => {
        const found = categorias.find((x) => x.categoria === c);
        return [c, found ? (found.orcamento_cents / 100).toFixed(2).replace(".", ",") : ""];
      })
    )
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetchOrToast(
      "/api/orcamento",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noivo1,
          noivo2,
          data_casamento: dataCasamento || null,
          orcamento_maximo_cents: parseBRLToCents(orcamento),
          observacoes,
          categorias: Object.entries(catValues).map(([categoria, v]) => ({
            categoria,
            orcamento_cents: parseBRLToCents(v),
          })),
        }),
      },
      "Erro ao salvar orçamento"
    );
    setSaving(false);
    if (!res) return;
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="card p-5">
        <h2 className="font-medium mb-4">Dados do casal</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome do(a) noivo(a) 1">
            <input className="input" value={noivo1} onChange={(e) => setNoivo1(e.target.value)} />
          </Field>
          <Field label="Nome do(a) noivo(a) 2">
            <input className="input" value={noivo2} onChange={(e) => setNoivo2(e.target.value)} />
          </Field>
          <Field label="Data do casamento">
            <input type="date" className="input" value={dataCasamento ?? ""} onChange={(e) => setDataCasamento(e.target.value)} />
          </Field>
          <Field label="Orçamento máximo (R$)">
            <input className="input" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} placeholder="80.000,00" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Observações">
            <textarea className="input min-h-20" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-champagne/15 text-sm">
          <p>
            <strong>{percentComprometido}%</strong> do orçamento já comprometido ({formatBRL(totalContratado)} de{" "}
            {formatBRL(parseBRLToCents(orcamento))})
          </p>
          <div className="w-full h-2 bg-white rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${percentComprometido > 100 ? "bg-danger" : "bg-accent"}`}
              style={{ width: `${Math.min(100, percentComprometido)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-medium mb-1">Orçamento por categoria (opcional)</h2>
        <p className="text-xs text-muted mb-4">
          Defina um limite para cada categoria. Um alerta visual aparecerá em Relatórios se o valor contratado ultrapassar o limite.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {CATEGORIAS_DESPESA.map((c) => (
            <Field key={c} label={c}>
              <input
                className="input"
                value={catValues[c]}
                onChange={(e) => setCatValues((v) => ({ ...v, [c]: e.target.value }))}
                placeholder="0,00"
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {savedAt && <span className="text-sm text-success">Salvo com sucesso.</span>}
      </div>
    </form>
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
