import Link from "next/link";
import { DEMO_USER_ID, supabase } from "@/lib/supabase";
import { DashboardCards } from "@/components/DashboardCards";
import { ExpenseListExpandable } from "@/components/ExpenseListExpandable";

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let summary = {
    totalThisMonth: 0,
    byCategory: [] as { label: string; amount: number }[],
    sharedExpenses: [] as { merchant: string | null; amount: number | null }[],
  };

  let friendAccounts: { name: string; status: string; amount: number; color: string }[] =
    [];

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
  let allExpensesRows: ExpenseRow[] = [];

  if (supabase) {
    const [expensesRes, categoriesRes, friendsRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", DEMO_USER_ID)
        .gte("date", startOfMonth.toISOString())
        .lte("date", now.toISOString()),
      supabase.from("categories").select("id, name").eq("user_id", DEMO_USER_ID),
      supabase.from("friends").select("id, name").eq("user_id", DEMO_USER_ID),
    ]);

    if (expensesRes.error) {
      console.error("[dashboard] Failed to fetch expenses", expensesRes.error);
    }
    const safeExpenses = expensesRes.data ?? [];
    const expenseIds = safeExpenses.map((e) => e.id);

    const categoryIdToName = new Map<string, string>();
    for (const c of categoriesRes.data ?? []) {
      categoryIdToName.set(c.id, c.name ?? "Sin categoría");
    }

    if (safeExpenses.length > 0) {
      const totalThisMonth = safeExpenses.reduce(
        (sum, e) => sum + (e.amount ?? 0),
        0,
      );

      const byCategoryMap = new Map<string, number>();
      for (const e of safeExpenses) {
        const label = categoryIdToName.get(e.category_id ?? "") ?? "Sin categoría";
        byCategoryMap.set(
          label,
          (byCategoryMap.get(label) ?? 0) + (e.amount ?? 0),
        );
      }

      const byCategory = Array.from(byCategoryMap.entries()).map(
        ([label, amount]) => ({ label, amount }),
      );

      const sharedExpenses = safeExpenses
        .filter((e) => e.is_shared)
        .map((e) => ({
          merchant: e.merchant as string | null,
          amount: e.amount as number | null,
        }));

      summary = {
        totalThisMonth,
        byCategory,
        sharedExpenses,
      };
    }

    // Balances with friends: paid_by_user true = you paid their share → they owe you; false = they paid → you owe them
    const balanceByFriend = new Map<string, number>();
    if (expenseIds.length > 0) {
      const { data: participants } = await supabase
        .from("expense_participants")
        .select("friend_id, share_amount, paid_by_user")
        .in("expense_id", expenseIds);
      for (const p of participants ?? []) {
        const friendId = p.friend_id as string;
        const amount = Number(p.share_amount) || 0;
        const delta = p.paid_by_user ? amount : -amount;
        balanceByFriend.set(
          friendId,
          (balanceByFriend.get(friendId) ?? 0) + delta,
        );
      }
    }

    // Lista completa de gastos (orden reciente) para la lista expandible
    const { data: allExpenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("date", { ascending: false })
      .limit(100);
    allExpensesRows = (allExpenses ?? []).map((e) => ({
      id: e.id as string,
      merchant: e.merchant as string | null,
      amount: e.amount as number | null,
      date: (e.date as string) ?? null,
      description: e.description as string | null,
      categoryName: categoryIdToName.get(e.category_id ?? "") ?? "Sin categoría",
      isShared: Boolean(e.is_shared),
      currency: e.currency as string | null,
    }));

    friendAccounts = (friendsRes.data ?? []).map((f) => {
      const balance = balanceByFriend.get(f.id) ?? 0;
      const status =
        balance > 0 ? "Te deben" : balance < 0 ? "Le debes" : "Al día";
      const color =
        balance > 0
          ? "text-emerald-400"
          : balance < 0
            ? "text-amber-400"
            : "text-zinc-400";
      return {
        name: f.name ?? "—",
        status,
        amount: Math.abs(balance),
        color,
      };
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-50">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
            <p className="text-sm text-zinc-400">
              Quick overview of today&apos;s expenses and shared balances.
            </p>
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <section>
            <DashboardCards summary={summary} />
          </section>
          <aside className="space-y-4">
            <div className="rounded-2xl bg-zinc-900 p-4 border border-zinc-800">
              <p className="text-xs font-medium text-zinc-400 uppercase">
                Friends & balances
              </p>
              <div className="mt-3 space-y-3">
                {friendAccounts.map((friend) => (
                  <div
                    key={friend.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-100">
                        {friend.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-50">
                          {friend.name}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {friend.status}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${friend.color}`}>
                      {friend.amount > 0
                        ? `$${friend.amount.toLocaleString("es-CO")}`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-900 p-4 border border-zinc-800 flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase">
                  Daily review
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Start a quick chat to review today&apos;s expenses and shared
                  payments.
                </p>
              </div>
              <Link
                href="/chat"
                className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-500 px-4 text-xs font-medium text-white shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400"
              >
                Iniciar chat diario
              </Link>
            </div>
          </aside>
        </div>

        <section className="mt-8">
          <ExpenseListExpandable expenses={allExpensesRows} />
        </section>
      </div>
    </div>
  );
}

