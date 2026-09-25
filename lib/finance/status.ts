// Pure functions to compute installment payment status.
// Status is NEVER a manual flag: it is always derived from due date + payment records.

export type ParcelaStatus = "pendente" | "pago" | "vencido" | "parcial" | "cancelado";

export interface PagamentoRecord {
  valorPagoCents: number;
}

export interface ParcelaLike {
  valorCents: number;
  vencimento: string; // ISO yyyy-MM-dd
  cancelada?: boolean;
}

/**
 * Computes the status of an installment from its due date and its payment records.
 * @param parcela the installment (value + due date)
 * @param pagamentos all payment records linked to this installment
 * @param today reference date (defaults to now) — injectable for testing
 */
export function computeParcelaStatus(
  parcela: ParcelaLike,
  pagamentos: PagamentoRecord[],
  today: Date = new Date()
): ParcelaStatus {
  if (parcela.cancelada) return "cancelado";

  const totalPago = pagamentos.reduce((sum, p) => sum + p.valorPagoCents, 0);

  if (totalPago >= parcela.valorCents && parcela.valorCents > 0) {
    return "pago";
  }
  if (totalPago > 0 && totalPago < parcela.valorCents) {
    return "parcial";
  }

  // No payment yet (or valorCents is 0, treat as pending until due).
  const todayIso = toIsoDateOnly(today);
  if (parcela.vencimento < todayIso) {
    return "vencido";
  }
  return "pendente";
}

export function toIsoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function totalPago(pagamentos: PagamentoRecord[]): number {
  return pagamentos.reduce((sum, p) => sum + p.valorPagoCents, 0);
}

export function totalRestante(parcela: ParcelaLike, pagamentos: PagamentoRecord[]): number {
  const restante = parcela.valorCents - totalPago(pagamentos);
  return restante > 0 ? restante : 0;
}

export function isVencendoEm(parcela: ParcelaLike, dias: number, today: Date = new Date()): boolean {
  const todayIso = toIsoDateOnly(today);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + dias);
  const limitIso = toIsoDateOnly(limit);
  return parcela.vencimento >= todayIso && parcela.vencimento <= limitIso;
}
