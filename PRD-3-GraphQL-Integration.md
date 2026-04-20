# PRD 3 — Clad GraphQL Integration

## Overview
Wire up the "Create Projects in Clad" button to actually create projects via Clad's GraphQL API. Each row in the preview table becomes one project creation request, with user-provided inputs (Assignee, Labels, Line Items) bulk-applied to all projects.

This PRD builds directly on PRDs 1 and 2.

---

## Prerequisites
- PRD 1 and PRD 2 complete
- Access to Clad's GraphQL playground to determine the correct mutation and field names
- A valid Clad API key

---

## Environment Configuration

Create a `.env.local` file in the project root (this file is already gitignored by Next.js):

```
CLAD_API_KEY=your_api_key_here
CLAD_GRAPHQL_URL=https://your-clad-instance.com/graphql
```

**Important:** Never expose `CLAD_API_KEY` to the browser. All GraphQL calls must go through a Next.js API route (server-side), not from the client directly.

---

## GraphQL Query Discovery

Before implementing, use the Clad GraphQL playground to identify the correct mutation for creating a project. You are looking for a mutation that accepts at minimum:

- Project title (string)
- Address (custom field)
- Drop Type (custom field)
- City (custom field)
- Assignee (user reference)
- Labels (array of strings or label IDs)
- Line items / budget items (array)

Document the discovered mutation in a file `src/lib/cladQueries.ts` as a string constant, for example:

```typescript
export const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      title
    }
  }
`;
```

> **Note for implementer:** The exact mutation name, input type name, and field names must be confirmed in the Clad GraphQL playground before coding this file. Treat the above as a placeholder structure. Update variable names and input shape to match what the playground reveals.

---

## API Route

### Location
`src/app/api/create-projects/route.ts`

### Method
`POST`

### Request Body
```typescript
type CreateProjectsRequest = {
  projects: {
    title: string;
    address: string;
    dropType: string;
    city: string;
  }[];
  assignee: string;
  labels: string[];
  lineItems: string[]; // only the checked ones
};
```

### Behavior
1. Parse and validate the request body
2. For each project in `projects`, construct the GraphQL variables object combining per-project fields (title, address, dropType, city) with bulk-applied fields (assignee, labels, lineItems)
3. Send one GraphQL mutation request per project to `CLAD_GRAPHQL_URL`
4. Include the API key in the request headers:
   ```
   Authorization: Bearer ${process.env.CLAD_API_KEY}
   Content-Type: application/json
   ```
5. Collect results: track successes (with returned project `id`) and failures (with error message)
6. Return a JSON response:
```typescript
type CreateProjectsResponse = {
  results: {
    title: string;
    success: boolean;
    projectId?: string;
    error?: string;
  }[];
  successCount: number;
  failureCount: number;
};
```

### Error Handling
- If `CLAD_API_KEY` or `CLAD_GRAPHQL_URL` are not set, return `500` with message `API configuration missing`
- If request body is malformed, return `400`
- If an individual project creation fails, do **not** abort the whole batch — continue and record the failure
- Log all errors to `console.error` server-side

### Concurrency
- Send project creation requests **sequentially** (not in parallel) in v1 to avoid rate limiting issues
- Add a 100ms delay between requests using `await new Promise(r => setTimeout(r, 100))`

---

## Client-Side Integration

### "Create Projects in Clad" Button — Submission Flow

In `PreviewPanel.tsx` (or `ImportTool.tsx`), wire up the button's `onClick` to:

1. Set `isSubmitting = true` (disables button, shows loading state)
2. Collect:
   - `parsedRows` → `projects`
   - `assignee`
   - `labels`
   - `lineItems.filter(i => i.checked).map(i => i.label)` → checked line items only
3. `POST` to `/api/create-projects` with the above payload
4. On response: set `submissionResults` state and set `isSubmitting = false`
5. Render results (see below)

### Button Loading State
While `isSubmitting === true`:
- Button shows a spinner icon (lucide-react `Loader2` with `animate-spin`) + text `Creating projects...`
- Button is disabled
- Left panel inputs are also disabled (prevent changes mid-submission)

---

## Results Display

After submission, replace the preview table with a **results summary view** in `PreviewPanel.tsx`.

### Success / Partial Success State
Render a results table with columns:

| Project Name | Status | Project ID |
|---|---|---|
| 123 Main St Project | ✓ Created | `abc123` |
| Oak Ave Drop | ✗ Failed | Error: ... |

- ✓ rows: `text-green-600`
- ✗ rows: `text-red-500`, show truncated error message with a tooltip for full message

Above the table, show a summary banner:
- All succeeded: `bg-green-50 border-green-200` — `✓ All X projects created successfully.`
- Partial: `bg-amber-50 border-amber-200` — `⚠ X of Y projects created. Z failed.`
- All failed: `bg-red-50 border-red-200` — `✗ All projects failed to create. Check the errors below.`

### Reset Flow
Below the results, show a `Start Over` button (ghost variant) that:
- Clears all state back to initial values
- Returns UI to the empty initial state

---

## Type Safety

Create `src/types/clad.ts` to house shared types:

```typescript
export type ProjectRow = {
  title: string;
  address: string;
  dropType: string;
  city: string;
};

export type SubmissionResult = {
  title: string;
  success: boolean;
  projectId?: string;
  error?: string;
};
```

Move `ProjectRow` from `parseCsv.ts` to this file and re-export from `parseCsv.ts` to avoid breaking changes.

---

## File Structure Changes
```
src/
  app/
    api/
      create-projects/
        route.ts          ← new: server-side API route
  lib/
    cladQueries.ts        ← new: GraphQL mutation strings
    parseCsv.ts           ← updated: re-exports ProjectRow from types/clad.ts
  types/
    clad.ts               ← new: shared TypeScript types
  components/
    PreviewPanel.tsx      ← updated: submission logic + results view
    ImportTool.tsx        ← updated: passes submission state down
.env.local                ← new: API key and GraphQL URL (gitignored)
```

---

## Acceptance Criteria
- [ ] `.env.local` is read correctly server-side; keys are never exposed to the browser
- [ ] Clicking "Create Projects in Clad" sends a POST to `/api/create-projects`
- [ ] Each project in the CSV generates one GraphQL mutation call
- [ ] Bulk fields (assignee, labels, checked line items) are included in every mutation
- [ ] Button shows loading spinner during submission
- [ ] Results table renders after submission with per-row success/failure status
- [ ] Summary banner reflects overall success/partial/failure state
- [ ] Individual project failures do not abort the rest of the batch
- [ ] "Start Over" button resets all state
- [ ] No API keys appear in client-side code or network requests from the browser
- [ ] No TypeScript errors
