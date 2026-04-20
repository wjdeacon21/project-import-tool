import Papa from "papaparse";
import type { ProjectRow } from "~/types/clad";

export type { ProjectRow };

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = candidates.map((c) => c.toLowerCase().trim());
  return headers.find((h) => normalized.includes(h.toLowerCase().trim()));
}

export function parseCsvToProjects(file: File): Promise<ProjectRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0]?.message ?? "Failed to parse CSV"));
          return;
        }

        const headers = results.meta.fields ?? [];
        const titleKey = findColumn(headers, ["project name", "title"]);
        const addressKey = findColumn(headers, ["street address", "address"]);
        const dropTypeKey = findColumn(headers, ["drop type", "droptype", "drop_type"]);
        const cityKey = findColumn(headers, ["city"]);
        const startDateKey = findColumn(headers, ["drop install started (a)", "drop install started", "start date"]);

        const rows = results.data
          .map((row) => ({
            title: (titleKey ? (row[titleKey] ?? "") : "").trim(),
            address: (addressKey ? (row[addressKey] ?? "") : "").trim(),
            dropType: (dropTypeKey ? (row[dropTypeKey] ?? "") : "").trim(),
            city: (cityKey ? (row[cityKey] ?? "") : "").trim(),
            startDate: (startDateKey ? (row[startDateKey] ?? "") : "").trim(),
          }))
          .filter((row) => row.title !== "");

        resolve(rows);
      },
      error(err) {
        reject(new Error(err.message));
      },
    });
  });
}
