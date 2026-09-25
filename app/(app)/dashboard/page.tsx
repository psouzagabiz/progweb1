export const dynamic = "force-dynamic";

import { requireUserAndWedding } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { computeParcelasComputed, listHistorico } from "@/lib/db/repo";
import { computeDashboardTotals } from "@/lib/finance/totals";
import { formatBRL } from "@/lib/finance/money";
import { formatDateBR } from "@/lib/utils/dates";
import { StatCard } from "@/components/ui/Card";
import { CategoriaPieChart, EvolucaoBarChart } from "@/components/dashboard/DashboardCharts";
import { AlertTriangle, Clock, Wallet, TrendingUp, CheckCircle2, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const { wedding } = ctx;

  const parcelas = computeParcelasComputed(wedding.id);
  const totals = computeDashboardTotals(parcelas, wedding.orcamento_maximo_cents);
  const historico = listHistorico(wedding.id, 8);

  const hoje = new Date().toISOString().slice(0, 10);
  const em7 = new Date();
  em7.setDate(em7.getDate() + 7);
  const em7Iso = em7.toISOString().slice(0, 10);

  const vencendoHoje = parcelas.filter((p) => p.status !== "pago" && p.status !== "cancelado" && p.vencimento === hoje);
  const vencendoEm7 = parcelas.filter(
    (p) => (p.status === "pendente" || p.status === "parcial") && p.vencimento > hoje && p.vencimento <= em7Iso
  );
  const vencidas = parcelas.filter((p) => p.status === "vencido");

  const somaVencendoHoje = vencendoHoje.reduce((s, p) => s + p.restanteCents, 0);
  const somaVencendoEm7 = vencendoEm7.reduce((s, p) => s + p.restanteCents, 0);
  const somaVencidas = vencidas.reduce((s, p) => s + p.restanteCents, 0);

  const porCategoria = new Map<string, number>();
  for (const p of parcelas) {
    if (p.status === "cancelado") continue;
    porCategoria.set(p.despesa_categoria, (porCategoria.get(p.despesa_categoria) ?? 0) + p.valorCents);
  }
  const categoriaData = Array.from(porCategoria.entries()).map(([categoria, valor]) => ({ categoria, valor }));

  const porMes = new Map<string, { contratado: number; pago: number; pendente: number }>();
  for (const p of parcelas) {
    if (p.status === "cancelado") continue;
    const mes = p.vencimento.slice(0, 7);
    const entry = porMes.get(mes) ?? { contratado: 0, pago: 0, pendente: 0 };
    entry.contratado += p.valorCents;
    entry.pago += p.pagoCents;
    entry.pendente += p.restanteCents;
    porMes.set(mes, entry);
  }
  const evolucaoData = Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 12)
    .map(([mes, v]) => ({ mes, ...v }));

  const noivos = [wedding.noivo1, wedding.noivo2].filter(Boolean).join(" & ") || "Seu casamento";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">{noivos}</h1>
        <p className="text-muted text-sm mt-1">
          {wedding.data_casamento ? `Casamento em ${formatDateBR(wedding.data_casamento)}` : "Defina a data do seu casamento em Orçamento"}
        </p>
      </div>

      {(somaVencidas > 0 || somaVencendoHoje > 0 || somaVencendoEm7 > 0) && (
        <div className="card p-4 border-l-4 border-l-danger flex flex-col gap-2">
          <div className="flex items-center gap-2 font-medium text-sm">
            <AlertTriangle className="w-4 h-4 text-danger" /> Alertas de vencimento
          </div>
          <div className="text-sm text-foreground/80 flex flex-col gap-1">
            {somaVencidas > 0 && (
              <p>
                Você tem <strong>{vencidas.length}</strong> parcela(s) <strong className="text-danger">vencida(s)</strong>, totalizando{" "}
                <strong>{formatBRL(somaVencidas)}</strong>.
              </p>
            )}
            {somaVencendoHoje > 0 && (
              <p>
                <strong>{vencendoHoje.length}</strong> parcela(s) vencem <strong>hoje</strong>, totalizando{" "}
                <strong>{formatBRL(somaVencendoHoje)}</strong>.
              </p>
            )}
            {somaVencendoEm7 > 0 && (
              <p>
                <strong>{vencendoEm7.length}</strong> parcela(s) vencem nos <strong>próximos 7 dias</strong>, totalizando{" "}
                <strong>{formatBRL(somaVencendoEm7)}</strong>.
              </p>
            )}
          </div>
          <Link href="/parcelas" className="text-sm text-accent font-medium underline w-fit">
            Ver parcelas
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Valor Total do Casamento" value={formatBRL(totals.valorTotalCasamento)} icon={DollarSign} />
        <StatCard label="Total Pago" value={formatBRL(totals.totalPago)} tone="success" icon={CheckCircle2} sub={`${totals.percentPago}% do total`} />
        <StatCard label="Total a Pagar" value={formatBRL(totals.totalAPagar)} tone="warning" icon={Wallet} sub={`${totals.percentPendente}% do total`} />
        <StatCard label="Vencido" value={formatBRL(totals.vencido)} tone="danger" icon={AlertTriangle} />
        <StatCard label="Próx. Vencimentos (30 dias)" value={formatBRL(totals.proximos30dias)} icon={Clock} />
        <StatCard
          label="Saldo Disponível"
          value={formatBRL(totals.saldoDisponivel)}
          tone={totals.saldoDisponivel < 0 ? "danger" : "success"}
          icon={TrendingUp}
          sub={`${totals.percentComprometido}% do orçamento comprometido`}
        />
        <StatCard label="Orçamento Máximo" value={formatBRL(totals.orcamentoMaximo)} icon={Wallet} />
        <StatCard label="% Comprometido" value={`${totals.percentComprometido}%`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <h2 className="font-medium mb-3 text-sm">Gastos por categoria</h2>
          <CategoriaPieChart data={categoriaData} />
        </div>
        <div className="card p-4 sm:p-5">
          <h2 className="font-medium mb-3 text-sm">Evolução (pago / pendente por mês)</h2>
          <EvolucaoBarChart data={evolucaoData} />
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-sm">Atividade recente</h2>
          <Link href="/historico" className="text-xs text-accent underline">
            Ver histórico completo
          </Link>
        </div>
        <ul className="flex flex-col divide-y divide-border">
          {historico.length === 0 && <p className="text-sm text-muted py-2">Nenhuma atividade ainda.</p>}
          {historico.map((h) => (
            <li key={h.id} className="py-2.5 text-sm flex items-center justify-between gap-3">
              <span>{h.descricao}</span>
              <span className="text-xs text-muted shrink-0">{new Date(h.created_at).toLocaleString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
