"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const CHART_HEIGHT_PX = 160;

function formatShortDate(iso: string | number) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(iso);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAxisDate(value: unknown) {
    return formatShortDate(value as string);
}

export function TrendChart({ data }: { data: { date: string; count: number }[] }) {
    if (data.length === 0) {
        return <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>;
    }

    return (
        <div style={{ height: CHART_HEIGHT_PX }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatAxisDate}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        tick={{ fill: "var(--chart-tick)", fontSize: 11 }}
                    />
                    <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={28}
                        tick={{ fill: "var(--chart-tick)", fontSize: 11 }}
                    />
                    <Tooltip
                        cursor={{ fill: "var(--chart-grid)" }}
                        contentStyle={{
                            background: "var(--chart-tooltip-bg)",
                            border: "1px solid var(--chart-tooltip-border)",
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        labelFormatter={formatAxisDate}
                        labelStyle={{ color: "var(--foreground)", marginBottom: 2 }}
                        itemStyle={{ color: "var(--chart-tick)" }}
                        formatter={(value) => [value, "Registrations"]}
                    />
                    <Bar
                        dataKey="count"
                        fill="var(--chart-primary)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
