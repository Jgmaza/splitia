export type ParsedExpense = {
  amount: number | null;
  merchant: string | null;
  currency: string | null;
  date?: string | null;
};

const AMOUNT_REGEX = /(?:\$|USD?\s*)\s*([\d,.]+)/i;

export function parseExpenseFromText(text: string): ParsedExpense {
  const amountMatch = text.match(AMOUNT_REGEX);
  let amount: number | null = null;

  if (amountMatch?.[1]) {
    const normalized = amountMatch[1].replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    amount = Number.isNaN(parsed) ? null : parsed;
  }

  // Very naive merchant extraction: take words after the amount.
  let merchant: string | null = null;
  if (amountMatch && amountMatch.index !== undefined) {
    const after = text.slice(amountMatch.index + amountMatch[0].length).trim();
    const merchantMatch = after.match(/(en|in)?\s*([A-Za-zÁÉÍÓÚÜÑ0-9' ]{3,})/i);
    if (merchantMatch?.[2]) {
      merchant = merchantMatch[2].trim();
    } else if (after.length > 0) {
      merchant = after.trim();
    }
  }

  return {
    amount,
    merchant,
    currency: amountMatch ? "COP" : null,
  };
}

