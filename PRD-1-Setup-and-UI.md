# PRD 1 — Project Setup & UI Shell

## Overview
Bootstrap a local T3 app that renders the full UI shell for the Clad Project Import Tool. No backend logic yet — this PRD covers scaffolding, layout, and all interactive UI components with mocked/static data.

---

## Tech Stack
- **Framework**: T3 App (`create-t3-app`) — TypeScript, Next.js (App Router), Tailwind CSS
- **UI Components**: shadcn/ui
- **Package Manager**: npm

---

## Initialization

Run the following to scaffold the project:

```bash
npx create-t3-app@latest clad-import-tool
```

Select the following options:
- TypeScript: Yes
- Tailwind: Yes
- tRPC: No
- Prisma: No
- NextAuth: No
- App Router: Yes

Then install shadcn:

```bash
npx shadcn@latest init
```

Install the following shadcn components:
- `button`
- `select`
- `badge`
- `checkbox`
- `table`
- `separator`

---

## Visual Design Direction

Reference the following design principles, derived from the provided inspiration screenshot:

### Color Palette
- Background: `#ffffff`
- Surface/Card: `#ffffff` with border `#e5e7eb` (Tailwind `border-gray-200`)
- Primary accent: `#7c3aed` (Tailwind `violet-700`) — used for links, primary buttons, and active badges
- Body text: `#111827` (Tailwind `gray-900`)
- Muted/subtext: `#6b7280` (Tailwind `gray-500`)
- Type badge backgrounds: light purple tint for STRING (`#ede9fe`), light gray for NUMBER (`#f3f4f6`)

### Typography
- Font: Use `Inter` via `next/font/google` — clean, readable, matches the inspiration's utilitarian admin aesthetic
- Page title: `text-2xl font-bold`
- Section headers: `text-lg font-semibold`
- Body/labels: `text-sm`
- Monospace field names: `font-mono text-sm`

### Layout Principles
- Generous padding and whitespace
- Cards with `rounded-xl border border-gray-200 shadow-sm p-6`
- Dashed border drag-drop zone
- Two-column layout below the banner (left panel ~30%, right panel ~70%)

---

## Page Layout

### Top Navigation Bar
- Left: breadcrumb text — `Admin / Project Import` in `text-sm text-gray-500`
- Right: link — `Back to Clad` in `text-sm text-violet-700 font-medium hover:underline` (href can be `#` for now)
- Separated from page content by a thin `border-b border-gray-200`

### Page Banner
Full-width section below the nav:
- Title: `Project Import Tool` — `text-2xl font-bold text-gray-900`
- Subtitle: `Upload a CSV file and configure settings to bulk-create projects in Clad.` — `text-sm text-gray-500`
- Bottom border separator

### Two-Column Body Layout
Below the banner, render two side-by-side cards:
- **Left card** (`w-[360px]`, fixed width): Inputs Panel
- **Right card** (flex-grow): Preview Panel

---

## Left Panel — Inputs

### Section: Project Template
- Label: `Project Template` — `text-base font-semibold`
- Subtext: `Choose which type of project you're creating.` — `text-sm text-gray-500`
- shadcn `<Select>` component with placeholder `Select a template`
- Hardcode one option for now: `Gateway Drops`

---

### Section: Inputs
Label: `Inputs` — `text-base font-semibold`

#### File Upload Area
A dashed-border upload box:
- Border: `border-2 border-dashed border-gray-300 rounded-lg`
- Content (centered vertically and horizontally):
  - Upload icon (use lucide-react `Upload` icon, `text-gray-400`)
  - Text: `Upload CSV with projects` — `text-sm text-gray-600`
  - Subtext: `Click to browse` — `text-xs text-gray-400`
- On click: trigger a hidden `<input type="file" accept=".csv" />`
- On file selected: display the filename below the upload box in `text-xs text-gray-500`
- State: empty vs. file-loaded (show filename + a small `×` remove button when loaded)

#### Assignee
- Label: `Assignee` — `text-sm font-medium text-gray-700`
- shadcn `<Select>` component
- Hardcode options: `Brett`, `Alex`, `Jordan` (these will be replaced with real API data in PRD 3)

#### Labels
- Label: `Labels` — `text-sm font-medium text-gray-700`
- Multi-tag input: render selected labels as shadcn `<Badge>` components with a `×` remove button
- Below badges: a small text input (`text-sm`) where user can type and press Enter to add a label
- Pre-populate with mock badges: `Drops`, `XYZ` for visual reference

#### Budget Selections (Line Items)
- Label: `Budget Selections` — `text-sm font-medium text-gray-700`
- Render a checklist using shadcn `<Checkbox>` components
- Hardcode 3 mock line items for now: `Site Work`, `Electrical`, `Permits`
- Each row: checkbox + label text side by side
- All checked by default

---

### Create Preview Button
- Full-width shadcn `<Button>` — variant `default`, color `bg-violet-700 hover:bg-violet-800 text-white`
- Label: `Create Preview`
- Position: bottom of left panel, `mt-auto`
- On click: sets a `showPreview` boolean state to `true` (no logic yet)

---

## Right Panel — Preview

### Empty State (before "Create Preview" is clicked)
- Show a muted placeholder: centered text `Upload a CSV and click "Create Preview" to see projects here.` in `text-sm text-gray-400`
- Optionally a subtle dashed border container

### Preview Table (after "Create Preview" is clicked)
Render a full-width shadcn `<Table>` with the following columns:

| # | Project Name | Address | Drop Type | City |
|---|---|---|---|---|

- Row numbers in `text-gray-400 text-sm`
- Populate with **hardcoded mock rows** (minimum 4):
  ```
  1 | 123 Main St Project | 123 Main St | Gateway | Springfield
  2 | Oak Ave Drop        | 456 Oak Ave | Standard | Shelbyville
  3 | River Rd Project    | 789 River Rd | Gateway | Capital City
  4 | Elm St Drop         | 321 Elm St  | Standard | Ogdenville
  ```
- Table header: `text-xs font-semibold text-gray-500 uppercase tracking-wide`
- Alternating row background: `bg-white` / `bg-gray-50`
- Row count summary above table: `4 projects found` in `text-sm text-gray-500`

### Create Projects in Clad Button
- Rendered **below the table**, aligned to the **bottom-right**
- shadcn `<Button>` — variant `default`, `bg-violet-700 hover:bg-violet-800 text-white`
- Label: `Create Projects in Clad`
- Only visible when `showPreview === true`
- On click: `console.log("Submit triggered")` for now

---

## State Management
Use React `useState` for the following:
- `csvFile: File | null` — the uploaded file
- `assignee: string` — selected assignee
- `labels: string[]` — array of label strings
- `lineItems: { label: string; checked: boolean }[]` — budget line items
- `showPreview: boolean` — controls preview panel visibility

No tRPC, no API calls in this PRD.

---

## File Structure
```
src/
  app/
    page.tsx          ← main page, imports <ImportTool />
    layout.tsx        ← root layout with font config
  components/
    ImportTool.tsx    ← top-level layout shell
    InputsPanel.tsx   ← left panel
    PreviewPanel.tsx  ← right panel
    FileUpload.tsx    ← file upload zone component
    TagInput.tsx      ← labels multi-tag input component
```

---

## Acceptance Criteria
- [ ] App runs locally with `npm run dev` on `localhost:3000`
- [ ] Top nav bar renders with breadcrumb and "Back to Clad" link
- [ ] Page banner renders with title and subtitle
- [ ] Left panel renders with all four input sections
- [ ] File upload zone accepts `.csv` and displays filename on selection
- [ ] Assignee dropdown renders with mock options
- [ ] Labels input allows adding and removing tags
- [ ] Budget checklist renders with mock items, all checked by default
- [ ] "Create Preview" button toggles preview panel visibility
- [ ] Preview table renders with 4 mock rows and correct columns
- [ ] "Create Projects in Clad" button appears below the table after preview is triggered
- [ ] No TypeScript errors, no console errors on load
