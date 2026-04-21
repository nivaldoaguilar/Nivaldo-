"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function RecebimentosChart({ data }: { data: { mes: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="mes" fontSize={12} />
        <YAxis
          fontSize={12}
          tickFormatter={(v) =>
            new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)
          }
        />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          labelStyle={{ color: "black" }}
        />
        <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
