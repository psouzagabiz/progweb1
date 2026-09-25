"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { formatBRL } from "@/lib/finance/money";

const COLOR = "#8a6f4e";

export function RankingBarChart({ data, colorKey }: { data: { label: string; valor: number; sobreOrcamento?: boolean }[]; colorKey?: boolean }) {
  if (data.length === 0) return <p className="text-sm text-muted py-6 text-center">Sem dados.</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d5" />
        <XAxis type="number" tickFormatter={(v) => `R$${Math.round(v / 100000)}k`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={120} />
        <Tooltip formatter={(v) => formatBRL(Number(v))} />
        <Bar dataKey="valor" fill={COLOR} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProjecaoLineChart({ data }: { data: { mes: string; acumulado: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-muted py-6 text-center">Sem dados suficientes.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d5" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `R$${Math.round(v / 100000)}k`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => formatBRL(Number(v))} />
        <Legend />
        <Line type="monotone" dataKey="acumulado" stroke="#8a6f4e" strokeWidth={2} name="Acumulado a pagar" />
      </LineChart>
    </ResponsiveContainer>
  );
}
