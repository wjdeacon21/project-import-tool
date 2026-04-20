import fs from "fs";
import path from "path";

type BudgetOverride = {
  lineItemId: string;
  quantity?: number;
  cost?: number;
};

type BudgetRule = {
  when: { field: string; equals: string };
  overrides: BudgetOverride[];
};

type BudgetItem = {
  lineItemId: string;
  price?: number;
  quantity?: number;
};

export function loadBudgetRules(): BudgetRule[] {
  const filePath = path.join(process.cwd(), "budget-rules.json");
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as BudgetRule[];
  } catch {
    return [];
  }
}

export function applyBudgetRules(
  rules: BudgetRule[],
  projectFields: Record<string, string>,
  items: BudgetItem[]
): BudgetItem[] {
  const quantityOverrides = new Map<string, number>();
  const costOverrides = new Map<string, number>();

  for (const rule of rules) {
    const fieldValue = (projectFields[rule.when.field] ?? "").trim().toLowerCase();
    if (fieldValue === rule.when.equals.trim().toLowerCase()) {
      for (const override of rule.overrides) {
        if (override.quantity !== undefined) quantityOverrides.set(override.lineItemId, override.quantity);
        if (override.cost !== undefined) costOverrides.set(override.lineItemId, override.cost);
      }
    }
  }

  if (quantityOverrides.size === 0 && costOverrides.size === 0) return items;

  return items.map((item) => ({
    ...item,
    ...(quantityOverrides.has(item.lineItemId) && { quantity: quantityOverrides.get(item.lineItemId) }),
    ...(costOverrides.has(item.lineItemId) && { price: costOverrides.get(item.lineItemId) }),
  }));
}
