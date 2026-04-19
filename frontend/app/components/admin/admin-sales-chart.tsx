"use client";

export type SalesChartPoint = { label: string; total: number; orderCount: number };

export function AdminSalesChart({ points, currency }: { points: SalesChartPoint[]; currency: string }) {
  const max = Math.max(1, ...points.map((p) => p.total));
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 });

  return (
    <div className="flex h-44 items-end gap-0.5 sm:gap-1">
      {points.map((p) => {
        const h = p.total > 0 ? Math.max(8, (p.total / max) * 100) : 2;
        return (
          <div key={p.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className="w-full max-w-8 rounded-t bg-emerald-500/85 transition hover:bg-emerald-600"
              style={{ height: `${h}%` }}
              title={`${p.label}: ${fmt.format(p.total)} (${p.orderCount} orders)`}
            />
            <span className="truncate text-[10px] font-medium text-zinc-500">{p.label.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}
