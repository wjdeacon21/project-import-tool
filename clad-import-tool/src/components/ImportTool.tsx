"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { InputsPanel } from "~/components/InputsPanel"
import { PreviewPanel } from "~/components/PreviewPanel"
import type { ProjectRow, OrgData, SubmissionResponse } from "~/types/clad"

export type LineItem = {
  id: string;
  label: string;
  checked: boolean;
};

export function ImportTool() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [orgDataError, setOrgDataError] = useState<string | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [assignee, setAssignee] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedRows, setParsedRows] = useState<ProjectRow[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResponse | null>(null);
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  useEffect(() => {
    fetch("/api/org-data")
      .then((res) => res.json())
      .then((data: OrgData | { error: string }) => {
        if ("error" in data) {
          setOrgDataError(data.error);
        } else {
          setOrgData(data);
          setLineItems(
            data.lineItems.map((item) => ({
              id: item.id,
              label: item.name,
              checked: true,
            }))
          );
          const dropsLabel = data.labels.find((l) => l.name === "Drops");
          if (dropsLabel) setSelectedLabelIds([dropsLabel.id]);
        }
      })
      .catch(() => setOrgDataError("Failed to load org data"));
  }, []);

  function handleLineItemChange(index: number, checked: boolean) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked } : item))
    );
  }

  function handleLabelToggle(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  function handleParsed(rows: ProjectRow[]) {
    setParsedRows(rows);
    setSelectedRowIndices(new Set(rows.map((_, i) => i)));
    setShowPreview(false);
    setSubmissionResults(null);
    setDuplicateIndices(new Set());
  }

  function handleRowSelectionChange(index: number, checked: boolean) {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev);
      checked ? next.add(index) : next.delete(index);
      return next;
    });
  }

  function handleSelectAll(selectAll: boolean) {
    setSelectedRowIndices(selectAll ? new Set(parsedRows.map((_, i) => i)) : new Set());
  }

  function handleParseError(error: string | null) {
    setParseError(error);
    if (error) {
      setParsedRows([]);
      setShowPreview(false);
    }
  }

  async function handleCreatePreview() {
    setIsCheckingDuplicates(true);
    try {
      const res = await fetch("/api/existing-project-ids");
      const data = (await res.json()) as { projectIds?: string[]; error?: string };
      if (data.projectIds) {
        const existingIds = new Set(data.projectIds);
        const dupes = new Set(
          parsedRows
            .map((row, i) => (row.projectId && existingIds.has(row.projectId) ? i : -1))
            .filter((i) => i !== -1)
        );
        setDuplicateIndices(dupes);
      }
    } catch {
      // don't block preview if the check fails
    } finally {
      setIsCheckingDuplicates(false);
    }
    setShowPreview(true);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/create-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: parsedRows.filter((_, i) => selectedRowIndices.has(i)),
          assigneeId: assignee,
          labelIds: selectedLabelIds,
          lineItemIds: lineItems.filter((i) => i.checked).map((i) => i.id),
        }),
      });
      const data = (await response.json()) as SubmissionResponse;
      setSubmissionResults(data);
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setCsvFile(null);
    setAssignee("");
    setSelectedLabelIds([]);
    setLineItems(
      orgData?.lineItems.map((item) => ({
        id: item.id,
        label: item.name,
        checked: true,
      })) ?? []
    );
    setShowPreview(false);
    setParsedRows([]);
    setSelectedRowIndices(new Set());
    setParseError(null);
    setIsSubmitting(false);
    setSubmissionResults(null);
    setDuplicateIndices(new Set());
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <span className="text-sm text-gray-500">Admin / Project Import</span>
        <Link href="#" className="text-sm font-medium text-violet-700 hover:underline">
          Back to Clad
        </Link>
      </nav>

      <div className="border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Project Import Tool</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV file and configure settings to bulk-create projects in Clad.
        </p>
      </div>

      <div className="flex items-start gap-6 p-6">
        <InputsPanel
          csvFile={csvFile}
          onFileChange={setCsvFile}
          onParsed={handleParsed}
          onParseError={handleParseError}
          assignee={assignee}
          onAssigneeChange={setAssignee}
          selectedLabelIds={selectedLabelIds}
          onLabelToggle={handleLabelToggle}
          lineItems={lineItems}
          onLineItemChange={handleLineItemChange}
          canPreview={parsedRows.length > 0}
          onCreatePreview={handleCreatePreview}
          isCheckingDuplicates={isCheckingDuplicates}
          orgData={orgData}
          orgDataError={orgDataError}
          isSubmitting={isSubmitting}
        />
        <PreviewPanel
          showPreview={showPreview}
          parsedRows={parsedRows}
          selectedRowIndices={selectedRowIndices}
          onRowSelectionChange={handleRowSelectionChange}
          onSelectAll={handleSelectAll}
          parseError={parseError}
          assignee={assignee}
          selectedLabelIds={selectedLabelIds}
          lineItems={lineItems}
          orgData={orgData}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          submissionResults={submissionResults}
          onReset={handleReset}
          duplicateIndices={duplicateIndices}
        />
      </div>
    </div>
  );
}
