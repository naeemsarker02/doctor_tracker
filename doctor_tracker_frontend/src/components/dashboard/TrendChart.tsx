const CHART_HEIGHT_PX = 128; // matches h-32 on the container below

export function TrendChart({ data }: { data: { date: string; count: number }[] }) {
    if (data.length === 0) {
        return <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>;
    }

    const max = Math.max(1, ...data.map((point) => point.count));

    return (
        <div className="flex h-32 items-end gap-1">
            {data.map((point) => (
                <div
                    key={point.date}
                    className="group relative flex-1"
                    title={`${point.date}: ${point.count}`}
                >
                    {/* Pixel height, not a % — the wrapper is a flex item with
                        items-end, so it shrink-wraps its content and never gets
                        a definite height for a % child to resolve against. */}
                    <div
                        className="w-full rounded-t bg-indigo-600 transition-colors group-hover:bg-indigo-400 dark:bg-indigo-500 dark:group-hover:bg-indigo-400"
                        style={{ height: Math.max(4, (point.count / max) * CHART_HEIGHT_PX) }}
                    />
                </div>
            ))}
        </div>
    );
}
