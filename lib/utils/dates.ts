import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return "-";
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
}

export function formatDateLongBR(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return "-";
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthLabelBR(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return format(d, "MMMM 'de' yyyy", { locale: ptBR });
}
