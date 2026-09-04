export function BarList({ items }: { items: { label: string; count: number }[] }) {
    if (items.length === 0) {
        return <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>;
    }

    const max = Math.max(1, ...items.map((item) => item.count));

    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 capitalize dark:text-slate-300">{item.label}</span>
                        <span className="text-slate-500 dark:text-slate-400">{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-1.5 rounded-full bg-indigo-600 transition-all dark:bg-indigo-500"
                            style={{ width: `${(item.count / max) * 100}%` }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
