"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { formatBRL } from "@/lib/finance/money";
import { formatDateBR } from "@/lib/utils/dates";

export interface PagamentoRow {
  id: string;
  despesa_nome: string;
  data_pagamento: string;
  valor_pago_cents: number;
  forma_pagamento: string;
  conta_cartao: string;
  observacao: string;
  comprovante_path: string | null;
}

export default function PagamentosClient({ pagamentos }: { pagamentos: PagamentoRow[] }) {
  const [formaFilter, setFormaFilter] = useState("");
  const [mesFilter, setMesFilter] = useState("");
  const [search, setSearch] = useState("");

  const formas = useMemo(() => Array.from(new Set(pagamentos.map((p) => p.forma_pagamento))), [pagamentos]);

  const filtered = pagamentos.filter((p) => {
    if (formaFilter && p.forma_pagamento !== formaFilter) return false;
    if (mesFilter && !p.data_pagamento.startsWith(mesFilter)) return false;
    if (search && !p.despesa_nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = filtered.reduce((s, p) => s + p.valor_pago_cents, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-[200px]" placeholder="Buscar despesa..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={formaFilter} onChange={(e) => setFormaFilter(e.target.value)}>
          <option value="">Todas formas</option>
          {formas.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <input type="month" className="input max-w-[160px]" value={mesFilter} onChange={(e) => setMesFilter(e.target.value)} />
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/export/pagamentos" className="btn-secondary flex items-center gap-2 ml-auto">
          <Download className="w-4 h-4" /> Exportar CSV
        </a>
      </div>

      <p className="text-sm text-muted">
        {filtered.length} pagamento(s) · total <strong className="text-foreground">{formatBRL(total)}</strong>
      </p>

      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-champagne/10 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Despesa</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium">Forma</th>
              <th className="px-4 py-3 font-medium">Conta/Cartão</th>
              <th className="px-4 py-3 font-medium">Comprovante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.despesa_nome}</td>
                <td className="px-4 py-3">{formatDateBR(p.data_pagamento)}</td>
                <td className="px-4 py-3 text-right">{formatBRL(p.valor_pago_cents)}</td>
                <td className="px-4 py-3">{p.forma_pagamento}</td>
                <td className="px-4 py-3">{p.conta_cartao || "-"}</td>
                <td className="px-4 py-3">
                  {p.comprovante_path ? (
                    <a href={`/api/uploads/${p.comprovante_path}`} target="_blank" className="text-accent underline flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Ver
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Nenhum pagamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="card p-4 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <p className="font-medium">{p.despesa_nome}</p>
              <p className="font-semibold">{formatBRL(p.valor_pago_cents)}</p>
            </div>
            <p className="text-xs text-muted">
              {formatDateBR(p.data_pagamento)} · {p.forma_pagamento} {p.conta_cartao && `· ${p.conta_cartao}`}
            </p>
            {p.comprovante_path && (
              <a href={`/api/uploads/${p.comprovante_path}`} target="_blank" className="text-xs text-accent underline">
                Ver comprovante
              </a>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted py-8">Nenhum pagamento encontrado.</p>}
      </div>
    </div>
  );
}
