"use client"

import { Button } from "~/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Checkbox } from "~/components/ui/checkbox"
import { Separator } from "~/components/ui/separator"
import { FileUpload } from "~/components/FileUpload"
import { type ProjectRow } from "~/lib/parseCsv"
import { type LineItem } from "~/components/ImportTool"
import type { OrgData } from "~/types/clad"

interface InputsPanelProps {
  csvFile: File | null;
  onFileChange: (file: File | null) => void;
  onParsed: (rows: ProjectRow[]) => void;
  onParseError: (error: string | null) => void;
  assignee: string;
  onAssigneeChange: (assignee: string) => void;
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  lineItems: LineItem[];
  onLineItemChange: (index: number, checked: boolean) => void;
  canPreview: boolean;
  onCreatePreview: () => void;
  isCheckingDuplicates: boolean;
  orgData: OrgData | null;
  orgDataError: string | null;
  isSubmitting: boolean;
}

export function InputsPanel({
  csvFile,
  onFileChange,
  onParsed,
  onParseError,
  assignee,
  onAssigneeChange,
  selectedLabelIds,
  onLabelToggle,
  lineItems,
  onLineItemChange,
  canPreview,
  onCreatePreview,
  isCheckingDuplicates,
  orgData,
  orgDataError,
  isSubmitting,
}: InputsPanelProps) {
  const disabled = isSubmitting || isCheckingDuplicates;

  return (
    <div className="flex w-[360px] shrink-0 flex-col rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Project Template */}
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-gray-900">Project Template</p>
        <p className="text-sm text-gray-500">Choose which type of project you&apos;re creating.</p>
        <Select defaultValue="gateway-drops" disabled={disabled}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gateway-drops">Gateway Drops</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-5" />

      <div className="flex flex-col gap-5">
        <p className="text-base font-semibold text-gray-900">Inputs</p>

        <FileUpload
          file={csvFile}
          onFileChange={onFileChange}
          onParsed={onParsed}
          onError={onParseError}
        />

        {/* Assignee */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Assignee</label>
          {orgDataError ? (
            <p className="text-xs text-red-500">{orgDataError}</p>
          ) : (
            <Select
              value={assignee}
              onValueChange={(v) => onAssigneeChange(v ?? "")}
              disabled={disabled || !orgData}
              items={orgData?.users.map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName}`,
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={orgData ? "Select an assignee" : "Loading..."} />
              </SelectTrigger>
              <SelectContent>
                {orgData?.users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Labels */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Labels</label>
          {!orgData ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : orgData.labels.length === 0 ? (
            <p className="text-xs text-gray-400">No labels available</p>
          ) : (
            <div className="flex flex-col gap-2">
              {orgData.labels.map((label) => (
                <div key={label.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`label-${label.id}`}
                    checked={selectedLabelIds.includes(label.id)}
                    onCheckedChange={() => onLabelToggle(label.id)}
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`label-${label.id}`}
                    className="cursor-pointer text-sm text-gray-700"
                  >
                    {label.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Selections */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Budget Selections</label>
          {!orgData ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : lineItems.length === 0 ? (
            <p className="text-xs text-gray-400">No line items available</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lineItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`line-item-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={(checked) => onLineItemChange(index, Boolean(checked))}
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`line-item-${item.id}`}
                    className="cursor-pointer text-sm text-gray-700"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button
          className="w-full bg-violet-700 text-white hover:bg-violet-800 disabled:opacity-50"
          onClick={onCreatePreview}
          disabled={!canPreview || disabled}
        >
          {isCheckingDuplicates ? (
            <>
              <Loader2 className="animate-spin" />
              Checking...
            </>
          ) : (
            "Create Preview"
          )}
        </Button>
      </div>
    </div>
  );
}
