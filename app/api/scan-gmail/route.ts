import { NextResponse } from "next/server";
import { supabase, DEMO_USER_ID } from "@/lib/supabase";
import { fetchRecentEmails, extractPotentialExpensesFromEmails } from "@/lib/gmail";
import { parseExpenseFromText } from "@/lib/expenseParser";

export async function POST() {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client is not configured" },
      { status: 500 },
    );
  }

  const emails = await fetchRecentEmails();
  const candidates = extractPotentialExpensesFromEmails(emails);

  const records = candidates.map((email) => {
    const parsed = parseExpenseFromText(
      `${email.subject} ${email.body}`.trim(),
    );
    return {
      user_id: DEMO_USER_ID,
      merchant: parsed.merchant,
      amount: parsed.amount,
      email_subject: email.subject,
      email_date: email.date,
      processed: false,
    };
  });

  if (records.length === 0) {
    return NextResponse.json({ expenses: [] });
  }

  // Avoid inserting duplicates each time the chat runs a scan (same subject + amount still pending)
  const { data: existing } = await supabase
    .from("email_expenses")
    .select("email_subject, amount")
    .eq("user_id", DEMO_USER_ID)
    .eq("processed", false);

  const seen = new Set<string>();
  for (const row of existing ?? []) {
    const sub = row.email_subject as string;
    const amt = row.amount != null ? String(row.amount) : "";
    seen.add(`${sub}|${amt}`);
  }

  const newRecords = records.filter((r) => {
    const key = `${r.email_subject}|${r.amount != null ? String(r.amount) : ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (newRecords.length === 0) {
    return NextResponse.json({ expenses: [], inserted: 0, skipped: records.length });
  }

  const { data, error } = await supabase
    .from("email_expenses")
    .insert(newRecords)
    .select("*");

  if (error) {
    console.error("[scan-gmail] Insert error", error);
    return NextResponse.json(
      { error: "Failed to store email expenses" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    expenses: data,
    inserted: data?.length ?? 0,
    skipped: records.length - (data?.length ?? 0),
  });
}

export async function GET() {
  return POST();
}

