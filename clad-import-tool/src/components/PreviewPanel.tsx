"use client"

import { useRef, useEffect } from "react"
import { Button } from "~/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Loader2, TriangleAlert } from "lucide-react"
import { type ProjectRow, type SubmissionResponse, type OrgData } from "~/types/clad"
import { type LineItem } from "~/components/ImportTool"

interface PreviewPanelProps {
  showPreview: boolean;
  parsedRows: ProjectRow[];
  selectedRowIndices: Set<number>;
  onRowSelectionChange: (index: number, checked: boolean) => void;
  onSelectAll: (selectAll: boolean) => void;
  parseError: string | null;
  assignee: string;
  selectedLabelIds: string[];
  lineItems: LineItem[];
  orgData: OrgData | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  submissionResults: SubmissionResponse | null;
  onReset: () => void;
  duplicateIndices: Set<number>;
}

function EmptyCell() {
  return <span className="text-gray-400">—</span>;
}

export function PreviewPanel({
  showPreview,
  parsedRows,
  selectedRowIndices,
  onRowSelectionChange,
  onSelectAll,
  parseError,
  assignee,
  selectedLabelIds,
  lineItems,
  orgData,
  isSubmitting,
  onSubmit,
  submissionResults,
  onReset,
  duplicateIndices,
}: PreviewPanelProps) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allSelected = selectedRowIndices.size === parsedRows.length && parsedRows.length > 0;
  const someSelected = selectedRowIndices.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);
  if (!showPreview) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 p-6 shadow-sm">
        <p className="text-center text-sm text-gray-400">
          Upload a CSV and click &quot;Create Preview&quot; to see projects here.
        </p>
      </div>
    );
  }

  if (submissionResults) {
    const { results, successCount, failureCount } = submissionResults;
    const total = results.length;
    const allSuccess = failureCount === 0;
    const allFailed = successCount === 0;

    return (
      <div className="flex flex-1 flex-col rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* Summary banner */}
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium ${
            allSuccess
              ? "border-green-200 bg-green-50 text-green-700"
              : allFailed
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {allSuccess
            ? `✓ All ${total} project${total !== 1 ? "s" : ""} created successfully.`
            : allFailed
              ? "✗ All projects failed to create. Check the errors below."
              : `⚠ ${successCount} of ${total} projects created. ${failureCount} failed.`}
        </div>

        {/* Results table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Project Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Project ID
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, i) => (
              <TableRow key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell className="text-sm text-gray-900">{result.title}</TableCell>
                <TableCell>
                  {result.success ? (
                    <span className="text-sm text-green-600">✓ Created</span>
                  ) : (
                    <span className="text-sm text-red-500" title={result.error}>
                      ✗ Failed
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {result.projectId ? (
                    <span className="font-mono text-gray-500">{result.projectId}</span>
                  ) : (
                    <span className="text-xs text-red-400 truncate block max-w-[200px]" title={result.error}>
                      {result.error}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onReset}>
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // Resolve display values for summary row
  const assigneeName = orgData?.users.find((u) => u.id === assignee)
    ? `${orgData.users.find((u) => u.id === assignee)!.firstName} ${orgData.users.find((u) => u.id === assignee)!.lastName}`
    : "—";
  const labelNames =
    selectedLabelIds.length > 0
      ? selectedLabelIds
          .map((id) => orgData?.labels.find((l) => l.id === id)?.name ?? id)
          .join(", ")
      : "—";
  const checkedLineItems = lineItems.filter((i) => i.checked);
  const lineItemNames =
    checkedLineItems.length > 0 ? checkedLineItems.map((i) => i.label).join(", ") : "—";

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-gray-200 p-6 shadow-sm">
      {parseError ? (
        <p className="text-sm text-red-500">{parseError}</p>
      ) : parsedRows.length === 0 ? (
        <p className="text-sm text-amber-600">
          No valid projects found in CSV. Please check your file and try again.
        </p>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {selectedRowIndices.size} of {parsedRows.length} project{parsedRows.length !== 1 ? "s" : ""} selected for import
            </p>
            <Button
              className="bg-violet-700 text-white hover:bg-violet-800 disabled:opacity-70"
              onClick={onSubmit}
              disabled={isSubmitting || selectedRowIndices.size === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating projects...
                </>
              ) : (
                "Create Projects in Clad"
              )}
            </Button>
          </div>

          {/* Summary strip */}
          <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            <span>Assignee: {assigneeName}</span>
            <span className="mx-3 text-gray-300">|</span>
            <span>Labels: {labelNames}</span>
            <span className="mx-3 text-gray-300">|</span>
            <span>Line Items: {lineItemNames}</span>
          </div>

          {duplicateIndices.size > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {duplicateIndices.size} project{duplicateIndices.size !== 1 ? "s" : ""} {duplicateIndices.size !== 1 ? "have" : "has"} a Project ID that already exists in Clad. Review the highlighted rows before submitting.
              </span>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-violet-700"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">#</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Project Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Street Address</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Drop Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">City</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Start Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Project ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedRows.map((row, i) => {
                const isDuplicate = duplicateIndices.has(i);
                return (
                  <TableRow key={i} className={isDuplicate ? "bg-amber-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRowIndices.has(i)}
                        onChange={(e) => onRowSelectionChange(i, e.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-violet-700"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">{i + 1}</TableCell>
                    <TableCell className="text-sm text-gray-900">{row.title || <EmptyCell />}</TableCell>
                    <TableCell className="text-sm text-gray-900">{row.address || <EmptyCell />}</TableCell>
                    <TableCell className="text-sm text-gray-900">{row.dropType || <EmptyCell />}</TableCell>
                    <TableCell className="text-sm text-gray-900">{row.city || <EmptyCell />}</TableCell>
                    <TableCell className="text-sm text-gray-900">{row.startDate || <EmptyCell />}</TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {isDuplicate ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                          {row.projectId}
                        </span>
                      ) : (
                        row.projectId || <EmptyCell />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

        </>
      )}
    </div>
  );
}
