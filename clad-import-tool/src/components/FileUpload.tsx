"use client"

import { useRef, useState } from "react"
import { Upload, Download } from "lucide-react"
import { parseCsvToProjects, type ProjectRow } from "~/lib/parseCsv"

const SAMPLE_CSV = `Project name,Street address,Drop Type,City
123 Main St Project,123 Main St,Gateway,Springfield
Oak Ave Drop,456 Oak Ave,Standard,Shelbyville
River Rd Project,789 River Rd,Gateway,Capital City
Elm St Drop,321 Elm St,Standard,Ogdenville
`

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample-projects.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onParsed: (rows: ProjectRow[]) => void;
  onError: (error: string | null) => void;
}

type ParseStatus =
  | { type: "success"; count: number }
  | { type: "error"; message: string }
  | null;

export function FileUpload({ file, onFileChange, onParsed, onError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parseStatus, setParseStatus] = useState<ParseStatus>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    e.target.value = "";

    if (!selected) return;

    onFileChange(selected);
    setIsLoading(true);
    setParseStatus(null);

    try {
      const rows = await parseCsvToProjects(selected);
      setParseStatus({ type: "success", count: rows.length });
      onParsed(rows);
      onError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CSV";
      setParseStatus({ type: "error", message });
      onParsed([]);
      onError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onFileChange(null);
    onParsed([]);
    onError(null);
    setParseStatus(null);
    setIsLoading(false);
  }

  return (
    <div>
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-gray-400"
      >
        <Upload className="text-gray-400" size={24} />
        <span className="text-sm text-gray-600">Upload CSV with projects</span>
        <span className="text-xs text-gray-400">Click to browse</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={downloadSampleCsv}
        className="mt-2 flex items-center gap-1 text-xs text-violet-700 hover:underline"
      >
        <Download size={12} />
        Download sample CSV
      </button>
      {file && (
        <div className="mt-2 flex items-center gap-2">
          <span className="max-w-[280px] truncate text-xs text-gray-500">{file.name}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}
      {isLoading && (
        <p className="mt-1.5 text-sm text-gray-400">Parsing...</p>
      )}
      {!isLoading && parseStatus?.type === "success" && (
        <p className="mt-1.5 text-sm text-green-600">
          ✓ {parseStatus.count} project{parseStatus.count !== 1 ? "s" : ""} found
        </p>
      )}
      {!isLoading && parseStatus?.type === "error" && (
        <p className="mt-1.5 text-sm text-red-500">{parseStatus.message}</p>
      )}
    </div>
  );
}
