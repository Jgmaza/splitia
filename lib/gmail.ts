type RawEmail = {
  id: string;
  subject: string;
  body: string;
  date: string;
};

type ParsedEmailExpense = {
  subject: string;
  body: string;
  date: string;
};

/**
 * MVP: mock inbox of expense-like emails. No Gmail API required.
 * Used by /api/scan-gmail to populate email_expenses for the chat flow.
 */
const MOCK_EMAILS: RawEmail[] = [
  {
    id: "mock-1",
    subject: "Compra por $45.000 en DiDi",
    body: "Compra por $45.000 en DiDi el día de hoy. Gracias por usar DiDi.",
    date: new Date().toISOString(),
  },
  {
    id: "mock-2",
    subject: "Compra por $120.000 en Chikos",
    body: "Compra por $120.000 en Chikos el día de hoy. Gracias por usar Chikos.",
    date: new Date().toISOString(),
  },
  {
    id: "mock-3",
    subject: "Compra por $15.000 en Terpel",
    body: "Compra por $15.000 en Terpel el día de hoy. Gracias por usar Terpel.",
    date: new Date().toISOString(),
  },
  {
    id: "mock-4",
    subject: "Compra por $52.000 en Éxito",
    body: "Compra por $52.000 en Éxito el día de hoy. Gracias por usar Éxito.",
    date: new Date().toISOString(),
  },
];

export async function fetchRecentEmails(): Promise<RawEmail[]> {
  // MVP: always use mock emails. Gmail API integration can be added later.
  return MOCK_EMAILS;
}

export function extractPotentialExpensesFromEmails(
  emails: RawEmail[],
): ParsedEmailExpense[] {
  const keywords = ["$", "pago", "compra", "transaction", "payment"];

  return emails
    .filter((email) => {
      const haystack = `${email.subject} ${email.body}`.toLowerCase();
      return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
    })
    .map((email) => ({
      subject: email.subject,
      body: email.body,
      date: email.date,
    }));
}

