"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatBRL } from "@/lib/finance/money";

const COLORS = ["#8a6f4e", "#b89b6a", "#d9c7a3", "#3f6b8a", "#3f7a5c", "#b8863a", "#b5453b", "#7a7266"];

export function CategoriaPieChart({ data }: { data: { categoria: string; valor: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted py-8 text-center">Nenhuma despesa cadastrada ainda.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="valor"
          nameKey="categoria"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatBRL(Number(v))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EvolucaoBarChart({
  data,
}: {
  data: { mes: string; contratado: number; pago: number; pendente: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted py-8 text-center">Sem dados suficientes ainda.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d5" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `R$${Math.round(v / 100000)}k`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => formatBRL(Number(v))} />
        <Legend />
        <Bar dataKey="pago" stackId="a" fill="#3f7a5c" name="Pago" />
        <Bar dataKey="pendente" stackId="a" fill="#b8863a" name="Pendente" />
      </BarChart>
    </ResponsiveContainer>
  );
}
