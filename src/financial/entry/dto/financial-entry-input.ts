export type FinancialEntryTypeInput =
  | "RECEIVABLE"
  | "PAYABLE"
  | "CREDIT"
  | "DEBIT";

export type FinancialEntryStatusInput =
  | "OPEN"
  | "PAID"
  | "OVERDUE"
  | "PENDING"
  | "COMPLETED";

export function normalizeFinancialEntryType(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (normalized === "CREDIT") return "RECEIVABLE";
  if (normalized === "DEBIT") return "PAYABLE";

  return normalized;
}

export function normalizeFinancialEntryStatus(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (normalized === "PENDING") return "OPEN";
  if (normalized === "COMPLETED") return "PAID";

  return normalized;
}
