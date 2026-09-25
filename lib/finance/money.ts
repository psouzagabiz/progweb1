// All money is handled as integer cents to avoid floating point errors.

export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function toReais(cents: number): number {
  return cents / 100;
}

export function formatBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Parses a pt-BR formatted or plain numeric string (e.g. "1.250,00" or "1250.00" or "1250") into cents. */
export function parseBRLToCents(input: string): number {
  if (input == null) return 0;
  let s = String(input).trim();
  if (s === "") return 0;
  // Remove currency symbol/spaces
  s = s.replace(/R\$\s?/g, "").trim();
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // pt-BR: dot = thousands, comma = decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma && !hasDot) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function sumCents(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10; // 1 decimal place
}
