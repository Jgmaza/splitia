type Summary = {
  totalThisMonth: number;
  byCategory: { label: string; amount: number }[];
  sharedExpenses: { merchant: string | null; amount: number | null }[];
};

type Props = {
  summary: Summary;
};

export function DashboardCards({ summary }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-zinc-900 p-4 shadow-sm border border-zinc-800">
          <p className="text-xs font-medium text-zinc-400 uppercase">
            Total this month
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            ${summary.totalThisMonth.toLocaleString("es-CO")}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-900 p-4 shadow-sm border border-zinc-800 md:col-span-2">
          <p className="text-xs font-medium text-zinc-400 uppercase">
            By category
          </p>
          <div className="mt-3 space-y-2">
            {summary.byCategory.length === 0 && (
              <p className="text-sm text-zinc-500">
                No expenses categorized yet.
              </p>
            )}
            {summary.byCategory.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (c.amount / summary.totalThisMonth || 0) * 100,
                      ).toFixed(0)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-zinc-100 min-w-[80px]">
                  {c.label}
                </span>
                <span className="text-xs text-zinc-400">
                  ${c.amount.toLocaleString("es-CO")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900 p-4 shadow-sm border border-zinc-800">
        <p className="text-xs font-medium text-zinc-400 uppercase">
          Shared expenses
        </p>
        <div className="mt-3 space-y-2">
          {summary.sharedExpenses.length === 0 && (
            <p className="text-sm text-zinc-500">
              No shared expenses recorded yet.
            </p>
          )}
          {summary.sharedExpenses.map((e, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm text-zinc-100"
            >
              <span>{e.merchant ?? "Unknown"}</span>
              <span className="text-zinc-400">
                {e.amount !== null
                  ? `$${e.amount.toLocaleString("es-CO")}`
                  : "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

