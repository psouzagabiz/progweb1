export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { computeParcelasComputed, listCategoriaOrcamentos, listFornecedores } from "@/lib/db/repo";
import { formatBRL } from "@/lib/finance/money";
import { RankingBarChart, ProjecaoLineChart } from "@/components/relatorios/RelatoriosCharts";
import ResumoMensal from "@/components/relatorios/ResumoMensal";
import { AlertTriangle } from "lucide-react";

export default async function RelatoriosPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const { wedding } = ctx;
  const parcelas = (await computeParcelasComputed(wedding.id)).filter((p) => p.status !== "cancelado");
  const fornecedores = await listFornecedores(wedding.id);
  const categoriaOrcamentos = await listCategoriaOrcamentos(wedding.id);

  // Gastos por categoria
  const porCategoria = new Map<string, number>();
  for (const p of parcelas) porCategoria.set(p.despesa_categoria, (porCategoria.get(p.despesa_categoria) ?? 0) + p.valorCents);
  const categoriaData = Array.from(porCategoria.entries())
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor);

  // Gastos por fornecedor (ranking, neutral)
  const fornecedorMap = new Map(fornecedores.map((f) => [f.id, f.nome]));
  const porFornecedor = new Map<string, number>();
  for (const p of parcelas) {
    if (!p.fornecedor_id) continue;
    porFornecedor.set(p.fornecedor_id, (porFornecedor.get(p.fornecedor_id) ?? 0) + p.valorCents);
  }
  const fornecedorData = Array.from(porFornecedor.entries())
    .map(([id, valor]) => ({ label: fornecedorMap.get(id) ?? "?", valor }))
    .sort((a, b) => b.valor - a.valor);

  // Pagamentos por mês
  const pagoPorMes = new Map<string, number>();
  for (const p of parcelas) {
    // approximate: attribute paid amount to due month (simplified true monthly-paid would need payment dates)
    if (p.pagoCents > 0) {
      const mes = p.vencimento.slice(0, 7);
      pagoPorMes.set(mes, (pagoPorMes.get(mes) ?? 0) + p.pagoCents);
    }
  }
  const pagamentosPorMesData = Array.from(pagoPorMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, valor]) => ({ label, valor }));

  // Projeção de fluxo de caixa até a data do casamento
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = wedding.data_casamento ?? "2100-01-01";
  const pendentesFuturos = parcelas.filter((p) => p.restanteCents > 0 && p.vencimento >= hoje && p.vencimento <= limite);
  const porMesProjecao = new Map<string, number>();
  for (const p of pendentesFuturos) {
    const mes = p.vencimento.slice(0, 7);
    porMesProjecao.set(mes, (porMesProjecao.get(mes) ?? 0) + p.restanteCents);
  }
  const projecaoData: { mes: string; acumulado: number }[] = [];
  {
    let acumulado = 0;
    for (const [mes, valor] of Array.from(porMesProjecao.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      acumulado += valor;
      projecaoData.push({ mes, acumulado });
    }
  }

  // Orçamento por categoria - alertas
  const orcamentoAlerts = categoriaOrcamentos
    .map((co) => {
      const contratado = porCategoria.get(co.categoria) ?? 0;
      return { categoria: co.categoria, orcamento: co.orcamento_cents, contratado, excedido: co.orcamento_cents > 0 && contratado > co.orcamento_cents };
    })
    .filter((a) => a.orcamento > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Relatórios</h1>
        <p className="text-muted text-sm mt-1">Análises financeiras do seu casamento.</p>
      </div>

      {orcamentoAlerts.some((a) => a.excedido) && (
        <div className="card p-4 border-l-4 border-l-danger">
          <div className="flex items-center gap-2 font-medium text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-danger" /> Categorias acima do orçamento
          </div>
          <ul className="text-sm flex flex-col gap-1">
            {orcamentoAlerts
              .filter((a) => a.excedido)
              .map((a) => (
                <li key={a.categoria}>
                  <strong>{a.categoria}</strong>: contratado {formatBRL(a.contratado)} / orçamento {formatBRL(a.orcamento)}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <h2 className="font-medium mb-3 text-sm">Gastos por categoria</h2>
          <RankingBarChart data={categoriaData} />
        </div>
        <div className="card p-4 sm:p-5">
          <h2 className="font-medium mb-3 text-sm">Gastos por fornecedor (ranking)</h2>
          <RankingBarChart data={fornecedorData} />
        </div>
      </div>

      <ResumoMensal parcelas={parcelas} />

      <div className="card p-4 sm:p-5">
        <h2 className="font-medium mb-3 text-sm">Pagamentos por mês</h2>
        <RankingBarChart data={pagamentosPorMesData} />
      </div>

      <div className="card p-4 sm:p-5">
        <h2 className="font-medium mb-1 text-sm">Projeção de fluxo de caixa</h2>
        <p className="text-xs text-muted mb-3">
          Total pendente acumulado mês a mês até a data do casamento{wedding.data_casamento ? "" : " (defina a data do casamento em Orçamento para um resultado mais preciso)"}.
        </p>
        <ProjecaoLineChart data={projecaoData} />
      </div>
    </div>
  );
}
