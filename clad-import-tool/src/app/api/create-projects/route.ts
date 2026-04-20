import { type NextRequest, NextResponse } from "next/server";
import { CREATE_PROJECT_MUTATION, CUSTOM_FIELD_IDS } from "~/lib/cladQueries";
import { loadLineItemConfig } from "~/lib/lineItemConfig";
import { loadBudgetRules, applyBudgetRules } from "~/lib/budgetRules";
import type { ProjectRow, SubmissionResult } from "~/types/clad";

function parseDateToISO(dateStr: string): string | null {
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
  if (mdy) return new Date(Date.UTC(+mdy[3]!, +mdy[1]! - 1, +mdy[2]!)).toISOString();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (iso) return new Date(Date.UTC(+iso[1]!, +iso[2]! - 1, +iso[3]!)).toISOString();
  return null;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

type CreateProjectsRequest = {
  projects: ProjectRow[];
  assigneeId: string;
  labelIds: string[];
  lineItemIds: string[];
};

type GraphQLProjectResponse = {
  data?: { createProject?: { id: string; title: string } };
  errors?: { message: string }[];
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.CLAD_API_KEY;
  const graphqlUrl = process.env.CLAD_GRAPHQL_URL;

  if (!apiKey || !graphqlUrl) {
    return NextResponse.json({ error: "API configuration missing" }, { status: 500 });
  }

  let body: CreateProjectsRequest;
  try {
    body = (await req.json()) as CreateProjectsRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { projects, assigneeId, labelIds, lineItemIds } = body;

  if (!Array.isArray(projects) || projects.length === 0) {
    return NextResponse.json({ error: "No projects provided" }, { status: 400 });
  }

  const lineItemConfigMap = new Map(
    loadLineItemConfig().map((item) => [item.id, item])
  );
  const budgetRules = loadBudgetRules();

  const results: SubmissionResult[] = [];

  for (const project of projects) {
    try {
      const customFieldValues = [
        project.address
          ? { fieldId: CUSTOM_FIELD_IDS.ADDRESS, textValue: project.address }
          : null,
        project.dropType
          ? { fieldId: CUSTOM_FIELD_IDS.DROP_TYPE, textValue: project.dropType }
          : null,
        project.city
          ? { fieldId: CUSTOM_FIELD_IDS.CITY, textValue: project.city }
          : null,
      ].filter(Boolean);

      const startsAt = project.startDate ? parseDateToISO(project.startDate) : null;
      const targetEndsAt = startsAt ? addDays(startsAt, 10) : null;

      const input: Record<string, unknown> = {
        title: project.title,
        ...(assigneeId && { assigneeId }),
        ...(labelIds.length > 0 && { labelIds }),
        ...(customFieldValues.length > 0 && { customFieldValues }),
        ...(lineItemIds.length > 0 && {
          budget: {
            items: applyBudgetRules(
              budgetRules,
              project as unknown as Record<string, string>,
              lineItemIds.map((id) => {
                const config = lineItemConfigMap.get(id);
                return {
                  lineItemId: id,
                  ...(config?.cost !== undefined && { price: config.cost }),
                  ...(config?.quantity !== undefined && { quantity: config.quantity }),
                };
              })
            ),
          },
        }),
        ...(startsAt && { startsAt }),
        ...(targetEndsAt && { targetEndsAt }),
      };

      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: CREATE_PROJECT_MUTATION, variables: { input } }),
      });

      const json = (await response.json()) as GraphQLProjectResponse;

      if (json.errors?.length ?? !json.data?.createProject) {
        const errorMsg = json.errors?.[0]?.message ?? "Unknown error";
        console.error(`Failed to create "${project.title}":`, errorMsg);
        results.push({ title: project.title, success: false, error: errorMsg });
      } else {
        results.push({
          title: project.title,
          success: true,
          projectId: json.data!.createProject!.id,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`Exception creating "${project.title}":`, errorMsg);
      results.push({ title: project.title, success: false, error: errorMsg });
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  return NextResponse.json({ results, successCount, failureCount });
}
