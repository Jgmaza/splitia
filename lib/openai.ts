import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

const client = apiKey
  ? new OpenAI({
      apiKey,
    })
  : null;

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

/** Categorías vienen siempre de la BD; el modelo elige por nombre o indica una nueva */
export type ChatAnalysisResult = {
  /** Debe coincidir exactamente con uno de los nombres de categoría del usuario (ver prompt dinámico) */
  category?: string;
  /** Si el usuario quiere crear una categoría nueva, el nombre propuesto (sin mapeo mock) */
  new_category?: string;
  is_shared?: boolean;
  participants?: string[];
  notes?: string;
  /** Si no puede decidir entre las opciones del usuario */
  category_unclear?: boolean;
};

export type AnalyzeOptions = {
  /** Lista desde la base de datos; el agente solo puede elegir entre estos nombres o proponer new_category */
  categories: { id: string; name: string }[];
};

function buildSystemPrompt(categories: { id: string; name: string }[]): string {
  const names = categories.map((c) => c.name).filter(Boolean);
  const list = names.length
    ? names.join(", ")
    : "(el usuario aún no tiene categorías; entonces setea new_category con el nombre que quiera crear)";

  return (
    "You classify expenses from a short chat. Reply ONLY with a JSON object. " +
    "Fields: " +
    "is_shared (boolean, required), " +
    "participants (array of strings: names of everyone the expense was shared with; REQUIRED whenever is_shared is true — extract names the user said, e.g. 'con Juan' -> [\"Juan\"]), " +
    "category (string): MUST be exactly one of these category names the user already has: " +
    list +
    ". " +
    "If the user's message clearly picks one of those names, use it exactly as listed. " +
    "If the user asks to add a new category or names a category not in the list, set new_category to the name they want (single string, no id). " +
    "If you cannot map to one of the existing names and the user hasn't named a new one, set category_unclear to true. " +
    "Never invent category ids. Only use names from the list or new_category."
  );
}

export async function analyzeChatMessage(
  messages: ChatMessage[],
  options?: AnalyzeOptions,
): Promise<ChatAnalysisResult | null> {
  if (!client) {
    console.warn("[openai] OPENAI_API_KEY not set, returning null analysis.");
    return null;
  }

  const categories = options?.categories ?? [];
  const systemMessage: ChatMessage = {
    role: "system",
    content: buildSystemPrompt(categories),
  };

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [systemMessage, ...messages],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content) as ChatAnalysisResult;
  } catch (error) {
    console.error("[openai] Failed to parse JSON response", error, content);
    return null;
  }
}
