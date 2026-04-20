# PRD 2 — CSV Parsing & Preview Population

## Overview
Wire up the file upload to actually parse the uploaded CSV, extract the required fields, and populate the preview table with real data. Also make the user inputs (Assignee, Labels, Line Items) functional so the full configured state is visible in the preview before submission.

This PRD builds directly on the UI shell from PRD 1. No Clad API calls yet.

---

## Prerequisites
PRD 1 must be complete. All components and state from PRD 1 are in place.

---

## CSV Format

The uploaded CSV will follow this structure. The first row is a header row.

### Expected CSV Columns (mapped to Clad project fields)
| CSV Column | Clad Field | Type |
|---|---|---|
| Title | Project Title | Text string |
| Address | Address (custom field) | Text string |
| Drop Type | Drop Type (custom field) | Text string |
| City | City (custom field) | Text string |

**Notes:**
- Column names in the CSV may not exactly match the above — implement case-insensitive, trimmed matching (e.g. `"  title "` should match `Title`)
- Extra columns in the CSV should be ignored
- Empty rows should be skipped
- A row is considered valid if it has at least a non-empty `Title` value

### Example CSV
```csv
Title,Address,Drop Type,City
123 Main St Project,123 Main St,Gateway,Springfield
Oak Ave Drop,456 Oak Ave,Standard,Shelbyville
River Rd Project,789 River Rd,Gateway,Capital City
Elm St Drop,321 Elm St,Standard,Ogdenville
```

---

## Dependencies to Install

```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

---

## Parsing Logic

### Location
Create a utility file: `src/lib/parseCsv.ts`

### Function Signature
```typescript
export type ProjectRow = {
  title: string;
  address: string;
  dropType: string;
  city: string;
};

export function parseCsvToProjects(file: File): Promise<ProjectRow[]>
```

### Implementation Requirements
- Use **PapaParse** (`papaparse`) with `header: true` and `skipEmptyLines: true`
- After parsing, normalize each row:
  - Find columns case-insensitively: `title`, `address`, `drop type` (also try `droptype`, `drop_type`), `city`
  - Trim all values
  - Filter out rows where `title` is empty after trimming
- Return array of `ProjectRow` objects
- If no valid rows found, return empty array (do not throw)
- Wrap in a `Promise` using PapaParse's `complete` callback

### Error Handling
- If PapaParse returns an error, reject the Promise with a descriptive message
- If the file is not a valid CSV (PapaParse fails to parse any rows), resolve with empty array and set an error state in the component

---

## Component Updates

### `FileUpload.tsx`
- On file selection, call `parseCsvToProjects(file)` immediately
- Store result in parent state via a callback prop: `onParsed: (rows: ProjectRow[]) => void`
- Show a loading indicator (simple spinner or text `Parsing...`) while parsing is in progress
- On success: display `✓ X projects found` in `text-sm text-green-600` below the upload zone
- On error: display error message in `text-sm text-red-500`

### `ImportTool.tsx` (top-level state)
Add new state:
```typescript
const [parsedRows, setParsedRows] = useState<ProjectRow[]>([]);
const [parseError, setParseError] = useState<string | null>(null);
```

Pass `onParsed` and `onError` down to `FileUpload`.

### `InputsPanel.tsx`

#### Assignee
- Keep as a `<Select>` with hardcoded options for now (real options come in PRD 3)
- Ensure selected value is stored in `ImportTool` state as `assignee: string`

#### Labels
- Ensure `TagInput` component stores values in `ImportTool` state as `labels: string[]`
- Labels will be bulk-applied to all projects — no per-row labels

#### Budget Selections (Line Items)
- Render checklist from `ImportTool` state `lineItems`
- Each item: `{ id: string; label: string; checked: boolean }`
- User can check/uncheck items
- Only checked items will be submitted to Clad (in PRD 3)
- Hardcoded default line items remain: `Site Work`, `Electrical`, `Permits`

### "Create Preview" Button
- Should be **disabled** (and visually dimmed) if `parsedRows.length === 0`
- On click: set `showPreview = true`

---

## Preview Table Updates

### `PreviewPanel.tsx`
Replace all hardcoded mock rows with real data from `parsedRows`.

#### Table Columns
| # | Project Name | Address | Drop Type | City |
|---|---|---|---|---|

- `#` column: 1-indexed row number
- Map `ProjectRow` fields to columns directly
- If a field is empty/missing for a row, render `—` (em dash) in `text-gray-400`

#### Row Count Summary
Above the table, render:
```
{parsedRows.length} project{parsedRows.length !== 1 ? 's' : ''} ready to import
```
Style: `text-sm text-gray-500`

#### Empty / Error States
- If `parsedRows.length === 0` and `showPreview === true`: render a message — `No valid projects found in CSV. Please check your file and try again.` in `text-sm text-amber-600`
- If `parseError` is set: render the error message in `text-sm text-red-500`

---

## User Input Summary Row (Optional Enhancement)
Below the table (above the submit button), render a small summary card showing the bulk-applied inputs:

```
Assignee: Brett   |   Labels: Drops, XYZ   |   Line Items: Site Work, Electrical, Permits
```

Style: `text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200`

This is informational only — not editable in the preview step.

---

## File Structure Changes
```
src/
  lib/
    parseCsv.ts       ← new: CSV parsing utility
  components/
    FileUpload.tsx    ← updated: triggers parse on file select
    PreviewPanel.tsx  ← updated: uses real parsedRows
    InputsPanel.tsx   ← updated: wires assignee/labels/lineItems to parent state
    ImportTool.tsx    ← updated: holds parsedRows, parseError in state
```

---

## Acceptance Criteria
- [ ] Uploading a valid CSV parses all rows and populates the preview table with real data
- [ ] Column matching is case-insensitive and trims whitespace
- [ ] Rows with empty `Title` are excluded
- [ ] Row count above table reflects actual parsed row count
- [ ] `Create Preview` button is disabled until a valid CSV with at least one row is uploaded
- [ ] Upload zone shows `✓ X projects found` on successful parse
- [ ] Upload zone shows error message if CSV is malformed or empty
- [ ] Missing fields in a row render as `—` in the table
- [ ] Assignee, Labels, and Line Items state is maintained and reflected in the summary row
- [ ] No TypeScript errors
