type ExpenseRow = {
  id: string;
  merchant: string | null;
  amount: number | null;
  date: string | null;
  description: string | null;
  categoryName: string;
  isShared: boolean;
  currency: string | null;
};

type Props = {
  expenses: ExpenseRow[];
};

/** Si la descripción trae "Compartido con: ...", mostrarlo en el resumen */
function sharedWithFromDescription(description: string | null): string | null {
  if (!description) return null;
  const m = description.match(/\|\s*Compartido con:\s*(.+)$/i);
  if (m) return m[1].trim();
  const m2 = description.match(/^Compartido con:\s*(.+)$/i);
  if (m2) return m2[1].trim();
  return null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ExpenseListExpandable({ expenses }: Props) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl bg-zinc-900 p-4 border border-zinc-800">
        <p className="text-xs font-medium text-zinc-400 uppercase">
          Todos los gastos
        </p>
        <p className="mt-3 text-sm text-zinc-500">No hay gastos registrados.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <p className="text-xs font-medium text-zinc-400 uppercase">
          Todos los gastos
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Toca cada fila para ver detalle
        </p>
      </div>
      <ul className="divide-y divide-zinc-800">
        {expenses.map((e) => {
          const sharedWith = sharedWithFromDescription(e.description);
          return (
          <li key={e.id}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-800/50 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-zinc-100">
                    {e.merchant ?? "Sin comercio"}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {formatDate(e.date)} · {e.categoryName}
                    {e.isShared
                      ? sharedWith
                        ? ` · Compartido con ${sharedWith}`
                        : " · Compartido"
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-emerald-400">
                  {e.amount != null
                    ? `$${e.amount.toLocaleString("es-CO")}`
                    : "—"}
                </span>
                <span className="shrink-0 text-zinc-500 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-400">
                {e.description && (
                  <p className="mb-2">
                    <span className="text-zinc-500">Descripción: </span>
                    {e.description}
                  </p>
                )}
                <p>
                  <span className="text-zinc-500">Moneda: </span>
                  {e.currency ?? "COP"}
                </p>
                <p className="mt-1">
                  <span className="text-zinc-500">
                    {e.isShared
                      ? sharedWith
                        ? `Compartido con: ${sharedWith}`
                        : "Gasto compartido"
                      : "Gasto personal"}
                  </span>
                </p>
              </div>
            </details>
          </li>
        );
        })}
      </ul>
    </div>
  );
}
