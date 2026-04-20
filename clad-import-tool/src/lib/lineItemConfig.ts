import fs from "fs";
import path from "path";
import Papa from "papaparse";

export type LineItemConfig = {
  id: string;
  cost: number;
  quantity?: number;
};

export function loadLineItemConfig(): LineItemConfig[] {
  const filePath = path.join(process.cwd(), "line-items.csv");
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data
    .map((row) => {
      const quantity = parseFloat(row.quantity ?? "");
      return {
        id: (row.id ?? "").trim(),
        cost: parseFloat(row.cost ?? ""),
        ...(isNaN(quantity) ? {} : { quantity }),
      };
    })
    .filter((row) => row.id !== "" && !isNaN(row.cost));
}
