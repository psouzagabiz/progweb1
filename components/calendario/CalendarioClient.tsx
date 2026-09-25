"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatBRL } from "@/lib/finance/money";
import { formatDateBR } from "@/lib/utils/dates";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils/cn";

interface ParcelaMini {
  id: string;
  despesa_nome: string;
  vencimento: string;
  valorCents: number;
  status: string;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function CalendarioClient({ parcelas }: { parcelas: ParcelaMini[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, ParcelaMini[]>();
    for (const p of parcelas) {
      const arr = map.get(p.vencimento) ?? [];
      arr.push(p);
      map.set(p.vencimento, arr);
    }
    return map;
  }, [parcelas]);

  const firstDay = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const selectedParcelas = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-champagne/15 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-medium">
          {MESES[month]} {year}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-champagne/15 rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const items = byDay.get(iso) ?? [];
            const total = items.reduce((s, p) => s + p.valorCents, 0);
            const hasVencido = items.some((p) => p.status === "vencido");
            const day = Number(iso.slice(8, 10));
            return (
              <button
                key={iso}
                onClick={() => setSelectedDay(iso)}
                className={cn(
                  "aspect-square rounded-lg border border-border flex flex-col items-center justify-center p-1 text-xs hover:bg-champagne/15",
                  items.length > 0 && "bg-champagne/10",
                  hasVencido && "border-danger/50 bg-red-50",
                  selectedDay === iso && "ring-2 ring-accent"
                )}
              >
                <span className="font-medium">{day}</span>
                {items.length > 0 && (
                  <span className="text-[9px] sm:text-[10px] text-muted leading-tight text-center">
                    {items.length}x
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="card p-4">
          <h3 className="font-medium mb-3">
            Vencimentos em {formatDateBR(selectedDay)} ({selectedParcelas.length})
          </h3>
          <div className="flex flex-col gap-2">
            {selectedParcelas.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                <span>{p.despesa_nome}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatBRL(p.valorCents)}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
            {selectedParcelas.length === 0 && <p className="text-sm text-muted">Nenhum vencimento neste dia.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
