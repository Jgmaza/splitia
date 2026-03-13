import { NextResponse } from "next/server";
import { supabase, DEMO_USER_ID } from "@/lib/supabase";
import { analyzeChatMessage, ChatMessage } from "@/lib/openai";

type ChatRequestBody = {
  messages: ChatMessage[];
};

type CategoryRow = { id: string; name: string | null };

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

/** Encuentra categoría por nombre exacto (normalizado) contra filas de BD */
function findCategoryIdByName(
  categories: CategoryRow[],
  label: string,
): string | null {
  const n = normalize(label);
  for (const c of categories) {
    if (c.name && normalize(c.name) === n) return c.id;
  }
  return null;
}

/**
 * Si el modelo no devolvió participants, intenta sacar nombres de los mensajes del usuario
 * (ej. "compartido con Juan y Pedro", "con Maria").
 */
function extractParticipantNamesFromMessages(
  messages: ChatMessage[],
): string[] {
  const userTexts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");
  const out = new Set<string>();
  // "con Juan y Pedro" o "con Juan, Pedro"
  const re = /\bcon\s+([^.?!\n]+)/gi;
  let match;
  while ((match = re.exec(userTexts)) !== null) {
    let chunk = match[1].trim();
    // cortar antes de palabras que no son nombres
    chunk = chunk.split(/\s+(y\s+)?(solo|categor)/i)[0] || chunk;
    const parts = chunk
      .split(/\s+y\s+|\s*,\s*/i)
      .map((p) => p.trim())
      .filter((p) => p.length > 1 && p.length < 40);
    for (const p of parts) {
      if (!/^(solo|compartido|con|categor)/i.test(p)) out.add(p);
    }
  }
  return Array.from(out);
}

/** Detecta "nueva: Nombre" o "agregar categoría Nombre" en el último mensaje del usuario */
function parseNewCategoryName(messages: ChatMessage[]): string | null {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content) return null;
  const text = lastUser.content.trim();
  const m1 = text.match(/^nueva\s*:\s*(.+)$/i);
  if (m1) return m1[1].trim();
  const m2 = text.match(/^agregar\s+categor[ií]a\s+(.+)$/i);
  if (m2) return m2[1].trim();
  const m3 = text.match(/^categor[ií]a\s+nueva\s*:\s*(.+)$/i);
  if (m3) return m3[1].trim();
  return null;
}

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client is not configured" },
      { status: 500 },
    );
  }

  const body = (await req.json().catch(() => null)) as
    | ChatRequestBody
    | null;

  const { data: pendingExpenses, error: fetchError } = await supabase
    .from("email_expenses")
    .select("*")
    .eq("user_id", DEMO_USER_ID)
    .eq("processed", false)
    .order("email_date", { ascending: true })
    .limit(1);

  if (fetchError) {
    console.error("[chat-agent] Failed to fetch pending expenses", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch pending expenses" },
      { status: 500 },
    );
  }

  const currentExpense = pendingExpenses?.[0];

  if (!currentExpense) {
    return NextResponse.json({
      completed: true,
      assistantMessage: "Ya no hay gastos pendientes por revisar hoy 🎉",
    });
  }

  if (!body || !body.messages || body.messages.length === 0) {
    const introMessage = `Detecté esta transacción:

${currentExpense.amount ? `$${currentExpense.amount}` : "Monto desconocido"}
${currentExpense.merchant ?? "Comercio desconocido"}

¿Fue solo para ti o compartida?`;

    return NextResponse.json({
      completed: false,
      assistantMessage: introMessage,
    });
  }

  // Categorías del usuario desde BD (sin mocks)
  const { data: categoriesRows } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", DEMO_USER_ID);

  const categories: CategoryRow[] = (categoriesRows ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string | null,
  }));

  const analysis = await analyzeChatMessage(body.messages, {
    categories: categories
      .filter((c): c is { id: string; name: string } => Boolean(c.name))
      .map((c) => ({ id: c.id, name: c.name as string })),
  });

  // Fallback sin OpenAI: último mensaje puede ser solo el nombre de categoría o "nueva: ..."
  let categoryId: string | null = null;
  const newCategoryName =
    analysis?.new_category?.trim() || parseNewCategoryName(body.messages);

  if (analysis?.category) {
    categoryId = findCategoryIdByName(categories, analysis.category);
  }

  if (!categoryId && newCategoryName) {
    const insertCat = await supabase
      .from("categories")
      .insert({
        user_id: DEMO_USER_ID,
        name: newCategoryName,
        icon: null,
      })
      .select("id")
      .single();
    if (!insertCat.error && insertCat.data?.id) {
      categoryId = insertCat.data.id as string;
      categories.push({ id: categoryId, name: newCategoryName });
    }
  }

  if (!categoryId) {
    // ¿Solo dijo un nombre que coincide con una categoría?
    const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
    if (lastUser?.content) {
      categoryId = findCategoryIdByName(categories, lastUser.content.trim());
    }
  }

  const is_shared =
    typeof analysis?.is_shared === "boolean"
      ? analysis.is_shared
      : false;
  let participants = analysis?.participants?.filter(Boolean) as
    | string[]
    | undefined;
  if (is_shared && (!participants || participants.length === 0)) {
    const extracted = extractParticipantNamesFromMessages(body.messages);
    if (extracted.length > 0) participants = extracted;
  }

  // Falta categoría o compartido: preguntar con lista real desde BD
  if (typeof analysis?.is_shared !== "boolean") {
    return NextResponse.json({
      completed: false,
      assistantMessage:
        "¿Ese gasto fue solo tuyo o compartido? Responde solo o compartido y con quién si aplica.",
    });
  }

  if (!categoryId) {
    const commaList =
      categories.length > 0
        ? categories.map((c) => c.name).filter(Boolean).join(", ")
        : "(aún no tienes categorías)";
    return NextResponse.json({
      completed: false,
      assistantMessage:
        `No asignaste categoría a este gasto. ¿Quieres usar una de las tuyas o agregar una nueva?\n\n` +
        `Categorías que tienes: ${commaList}\n\n` +
        `Responde con el nombre exacto de una de ellas, o escribe **nueva: Nombre** para crearla y usarla en este gasto.`,
    });
  }

  // Descripción: asunto del correo + con quién se compartió si aplica (siempre que is_shared)
  let expenseDescription = (currentExpense.email_subject as string) ?? "";
  if (is_shared) {
    const names =
      participants && participants.length > 0
        ? participants.filter(Boolean).join(", ")
        : null;
    if (names) {
      expenseDescription = expenseDescription
        ? `${expenseDescription} | Compartido con: ${names}`
        : `Compartido con: ${names}`;
    } else {
      // Queda explícito que es compartido aunque no se pudo obtener nombres
      expenseDescription = expenseDescription
        ? `${expenseDescription} | Compartido (indica con quién si quieres dejarlo registrado)`
        : "Compartido (indica con quién si quieres dejarlo registrado)";
    }
  }

  const expenseInsert = await supabase
    .from("expenses")
    .insert({
      user_id: DEMO_USER_ID,
      amount: currentExpense.amount,
      merchant: currentExpense.merchant,
      description: expenseDescription,
      category_id: categoryId,
      currency: "COP",
      date: currentExpense.email_date,
      is_shared: is_shared ?? false,
    })
    .select("id")
    .single();

  if (expenseInsert.error) {
    console.error("[chat-agent] Failed to insert expense", expenseInsert.error);
    return NextResponse.json(
      { error: "Failed to store expense" },
      { status: 500 },
    );
  }

  const expenseId = expenseInsert.data!.id as string;

  if (is_shared && participants && participants.length > 0) {
    try {
      await supabase.from("expense_participants").insert(
        participants.map(() => ({
          expense_id: expenseId,
          friend_id: null,
          share_amount: null,
          paid_by_user: true,
        })),
      ); // friend_id por nombre: enlazar con tabla friends en una siguiente iteración
    } catch (error) {
      console.warn(
        "[chat-agent] Failed to insert participants, continuing without them",
        error,
      );
    }
  }

  const { error: updateError } = await supabase
    .from("email_expenses")
    .update({ processed: true })
    .eq("id", currentExpense.id);

  if (updateError) {
    console.error(
      "[chat-agent] Failed to mark email_expense as processed",
      updateError,
    );
  }

  const { data: nextPending } = await supabase
    .from("email_expenses")
    .select("*")
    .eq("user_id", DEMO_USER_ID)
    .eq("processed", false)
    .order("email_date", { ascending: true })
    .limit(1);

  const nextExpense = nextPending?.[0];
  if (nextExpense) {
    const introMessage = `Listo, guardé ese gasto.

Siguiente transacción detectada:

${nextExpense.amount ? `$${nextExpense.amount}` : "Monto desconocido"}
${nextExpense.merchant ?? "Comercio desconocido"}

¿Fue solo para ti o compartida?`;

    return NextResponse.json({
      completed: false,
      assistantMessage: introMessage,
      resetConversation: true,
    });
  }

  return NextResponse.json({
    completed: true,
    assistantMessage:
      "Listo, guardé ese gasto. Ya no hay más gastos pendientes por revisar 🎉",
  });
}
