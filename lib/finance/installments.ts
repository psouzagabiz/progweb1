// Pure functions for installment (parcela) generation and rounding logic.
import { addDays, addMonths } from "date-fns";

export type Periodicidade = "mensal" | "quinzenal" | "semanal" | "personalizada";

export interface GeneratedInstallment {
  numero: number;
  valorCents: number;
  vencimento: string; // ISO date yyyy-MM-dd
  label: string;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addPeriod(base: Date, periodicidade: Periodicidade, intervaloDias: number, n: number): Date {
  switch (periodicidade) {
    case "mensal":
      return addMonths(base, n);
    case "quinzenal":
      return addDays(base, n * 15);
    case "semanal":
      return addDays(base, n * 7);
    case "personalizada":
      return addDays(base, n * intervaloDias);
    default:
      return addMonths(base, n);
  }
}

/**
 * Splits totalCents into `count` installments as evenly as possible.
 * Any remainder (due to integer division) is added to the LAST installment
 * so the sum always equals totalCents exactly.
 */
export function splitEvenly(totalCents: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  const result = new Array(count).fill(base);
  // distribute remainder cents into the last installment
  result[count - 1] += remainder;
  return result;
}

export interface GenerateInstallmentsParams {
  valorTotalCents: number;
  valorEntradaCents: number; // 0 if no entrada
  numParcelas: number; // number of parcelas AFTER entrada (does not include entrada itself)
  dataContratacao: string; // ISO date, base date for first installment due date
  periodicidade: Periodicidade;
  intervaloDias: number; // used only when periodicidade === 'personalizada'
  incluirEntradaComoParcela?: boolean; // if true, entrada becomes parcela 0 due immediately
}

/**
 * Generates the list of installments for a "parcelado" or "entrada_parcelas" expense.
 * The entrada (down payment) is deducted from the total BEFORE splitting into parcelas.
 * The sum of all generated installments (including entrada, if included) is always
 * exactly equal to valorTotalCents (rounding remainder goes to the last regular parcela).
 */
export function generateInstallments(params: GenerateInstallmentsParams): GeneratedInstallment[] {
  const {
    valorTotalCents,
    valorEntradaCents,
    numParcelas,
    dataContratacao,
    periodicidade,
    intervaloDias,
  } = params;

  const result: GeneratedInstallment[] = [];
  const baseDate = new Date(dataContratacao + "T00:00:00Z");

  const restante = Math.max(0, valorTotalCents - valorEntradaCents);
  let entradaNumero = 0;

  if (valorEntradaCents > 0) {
    result.push({
      numero: 0,
      valorCents: valorEntradaCents,
      vencimento: toIso(baseDate),
      label: "Entrada",
    });
    entradaNumero = 1;
  }

  if (numParcelas > 0) {
    const valores = splitEvenly(restante, numParcelas);
    for (let i = 0; i < numParcelas; i++) {
      const due = addPeriod(baseDate, periodicidade, intervaloDias, i + entradaNumero);
      result.push({
        numero: i + 1,
        valorCents: valores[i],
        vencimento: toIso(due),
        label: `Parcela ${i + 1}/${numParcelas}`,
      });
    }
  } else if (restante > 0 && valorEntradaCents === 0) {
    // à vista: single installment
    result.push({
      numero: 1,
      valorCents: restante,
      vencimento: toIso(baseDate),
      label: "Pagamento único",
    });
  } else if (restante > 0) {
    // entrada exists but no parcelas specified: remaining goes as a single installment
    const due = addPeriod(baseDate, periodicidade, intervaloDias, 1);
    result.push({
      numero: 1,
      valorCents: restante,
      vencimento: toIso(due),
      label: "Saldo restante",
    });
  }

  return result;
}

/** Validates that a list of installment values sums exactly to the expected total. */
export function validateSum(valores: number[], expectedTotalCents: number): boolean {
  return sum(valores) === expectedTotalCents;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Given a list of manually-edited installment values that no longer sum to the
 * expected total, returns the difference (positive = missing, negative = excess).
 */
export function sumDifference(valores: number[], expectedTotalCents: number): number {
  return expectedTotalCents - sum(valores);
}
