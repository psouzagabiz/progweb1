import { computeParcelaStatus, totalPago, totalRestante, type ParcelaStatus } from "./status";

export interface ParcelaWithPagamentos {
  id: string;
  valorCents: number;
  vencimento: string;
  cancelada: boolean;
  pagamentos: { valorPagoCents: number }[];
}

export interface ParcelaComputed {
  id: string;
  valorCents: number;
  vencimento: string;
  status: ParcelaStatus;
  pagoCents: number;
  restanteCents: number;
}

export function computeParcela(p: ParcelaWithPagamentos, today: Date = new Date()): ParcelaComputed {
  const status = computeParcelaStatus(p, p.pagamentos, today);
  return {
    id: p.id,
    valorCents: p.valorCents,
    vencimento: p.vencimento,
    status,
    pagoCents: totalPago(p.pagamentos),
    restanteCents: totalRestante(p, p.pagamentos),
  };
}

export interface DashboardTotals {
  valorTotalCasamento: number;
  totalPago: number;
  totalAPagar: number;
  vencido: number;
  proximos30dias: number;
  orcamentoMaximo: number;
  saldoDisponivel: number;
  percentComprometido: number;
  percentPago: number;
  percentPendente: number;
}

export function computeDashboardTotals(
  parcelas: ParcelaComputed[],
  orcamentoMaximoCents: number,
  today: Date = new Date()
): DashboardTotals {
  const ativos = parcelas.filter((p) => p.status !== "cancelado");
  const valorTotalCasamento = ativos.reduce((s, p) => s + p.valorCents, 0);
  const totalPagoV = ativos.reduce((s, p) => s + p.pagoCents, 0);
  const totalAPagar = ativos.reduce((s, p) => s + p.restanteCents, 0);
  const vencido = ativos
    .filter((p) => p.status === "vencido")
    .reduce((s, p) => s + p.restanteCents, 0);

  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);
  const todayIso = today.toISOString().slice(0, 10);
  const in30Iso = in30.toISOString().slice(0, 10);
  const proximos30dias = ativos
    .filter(
      (p) =>
        (p.status === "pendente" || p.status === "parcial") &&
        p.vencimento >= todayIso &&
        p.vencimento <= in30Iso
    )
    .reduce((s, p) => s + p.restanteCents, 0);

  const saldoDisponivel = orcamentoMaximoCents - valorTotalCasamento;
  const percentComprometido =
    orcamentoMaximoCents > 0 ? Math.round((valorTotalCasamento / orcamentoMaximoCents) * 1000) / 10 : 0;
  const percentPago =
    valorTotalCasamento > 0 ? Math.round((totalPagoV / valorTotalCasamento) * 1000) / 10 : 0;
  const percentPendente =
    valorTotalCasamento > 0 ? Math.round((totalAPagar / valorTotalCasamento) * 1000) / 10 : 0;

  return {
    valorTotalCasamento,
    totalPago: totalPagoV,
    totalAPagar,
    vencido,
    proximos30dias,
    orcamentoMaximo: orcamentoMaximoCents,
    saldoDisponivel,
    percentComprometido,
    percentPago,
    percentPendente,
  };
}
