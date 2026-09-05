"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ROW_HEIGHT_PX = 32;
const MIN_CHART_HEIGHT_PX = 80;

export function BarList({ items }: { items: { label: string; count: number }[] }) {
    if (items.length === 0) {
        return <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>;
    }

    const height = Math.max(MIN_CHART_HEIGHT_PX, items.length * ROW_HEIGHT_PX);

    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={items}
                    layout="vertical"
                    margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
                    barCategoryGap="30%"
                >
                    <XAxis type="number" hide />
                    <YAxis
                        type="category"
                        dataKey="label"
                        width={140}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
                        tickFormatter={(value: string) =>
                            value.length > 22 ? `${value.slice(0, 21)}…` : value
                        }
                    />
                    <Tooltip
                        cursor={{ fill: "var(--chart-grid)" }}
                        contentStyle={{
                            background: "var(--chart-tooltip-bg)",
                            border: "1px solid var(--chart-tooltip-border)",
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        labelStyle={{ color: "var(--foreground)", marginBottom: 2 }}
                        itemStyle={{ color: "var(--chart-tick)" }}
                        formatter={(value) => [value, "Count"]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                        {items.map((item) => (
                            <Cell key={item.label} fill="var(--chart-primary)" />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
