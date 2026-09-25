"use client";

import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/finance/money";

interface ParcelaMini {
  vencimento: string;
  valorCents: number;
  pagoCents: number;
  restanteCents: number;
  status: string;
}

export default function ResumoMensal({ parcelas }: { parcelas: ParcelaMini[] }) {
  const now = new Date();
  const [mes, setMes] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const resumo = useMemo(() => {
    const doMes = parcelas.filter((p) => p.vencimento.startsWith(mes));
    return {
      previsto: doMes.reduce((s, p) => s + p.valorCents, 0),
      pago: doMes.reduce((s, p) => s + p.pagoCents, 0),
      pendente: doMes.filter((p) => p.status === "pendente" || p.status === "parcial").reduce((s, p) => s + p.restanteCents, 0),
      vencido: doMes.filter((p) => p.status === "vencido").reduce((s, p) => s + p.restanteCents, 0),
    };
  }, [parcelas, mes]);

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-sm">Resumo mensal</h2>
        <input type="month" className="input max-w-[160px]" value={mes} onChange={(e) => setMes(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Previsto" value={resumo.previsto} />
        <Stat label="Pago" value={resumo.pago} tone="text-success" />
        <Stat label="Pendente" value={resumo.pendente} tone="text-warning" />
        <Stat label="Vencido" value={resumo.vencido} tone="text-danger" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-semibold ${tone ?? ""}`}>{formatBRL(value)}</p>
    </div>
  );
}
