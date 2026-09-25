"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface Results {
  fornecedores: { id: string; nome: string; categoria: string }[];
  despesas: { id: string; nome: string; categoria: string }[];
  parcelas: { id: string; despesa_nome: string; numero: number; vencimento: string }[];
}

export default function BuscaPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(value: string) {
    setQ(value);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/busca?q=${encodeURIComponent(value)}`);
    setResults(await res.json());
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Busca global</h1>
        <p className="text-muted text-sm mt-1">Pesquise fornecedores, despesas, parcelas e categorias.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          className="input pl-9"
          placeholder="Digite para buscar..."
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {loading && <p className="text-sm text-muted">Buscando...</p>}

      {results && (
        <div className="flex flex-col gap-6">
          <ResultSection title="Fornecedores">
            {results.fornecedores.map((f) => (
              <Link key={f.id} href={`/fornecedores/${f.id}`} className="block px-4 py-3 hover:bg-champagne/10">
                <p className="font-medium">{f.nome}</p>
                <p className="text-xs text-muted">{f.categoria}</p>
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Despesas">
            {results.despesas.map((d) => (
              <Link key={d.id} href="/despesas" className="block px-4 py-3 hover:bg-champagne/10">
                <p className="font-medium">{d.nome}</p>
                <p className="text-xs text-muted">{d.categoria}</p>
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Parcelas">
            {results.parcelas.map((p) => (
              <Link key={p.id} href="/parcelas" className="block px-4 py-3 hover:bg-champagne/10">
                <p className="font-medium">
                  {p.despesa_nome} · Parcela {p.numero}
                </p>
              </Link>
            ))}
          </ResultSection>
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  if (!hasChildren) return null;
  return (
    <div className="card divide-y divide-border overflow-hidden">
      <p className="px-4 py-2 text-xs font-medium text-muted bg-champagne/10">{title}</p>
      {children}
    </div>
  );
}
