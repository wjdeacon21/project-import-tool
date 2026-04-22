import { NextResponse } from "next/server";
import { GET_ORG_PROJECTS_QUERY, CUSTOM_FIELD_IDS } from "~/lib/cladQueries";

type CustomFieldValue = {
  field?: { id: string };
  textValue?: string;
};

type GraphQLProjectsResponse = {
  data?: {
    getOrg?: {
      projects: {
        items: { customFieldValues: CustomFieldValue[] }[];
        nextOffset: number | null;
      };
    };
  };
  errors?: { message: string }[];
};

export async function GET() {
  const apiKey = process.env.CLAD_API_KEY;
  const graphqlUrl = process.env.CLAD_GRAPHQL_URL;

  if (!apiKey || !graphqlUrl) {
    return NextResponse.json({ error: "API configuration missing" }, { status: 500 });
  }

  const existingProjectIds: string[] = [];
  let offset = 0;

  while (true) {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: GET_ORG_PROJECTS_QUERY, variables: { offset } }),
    });

    const json = (await response.json()) as GraphQLProjectsResponse;

    if (json.errors?.length) {
      console.error("GraphQL errors fetching projects:", json.errors);
      return NextResponse.json({ error: json.errors[0]?.message }, { status: 500 });
    }

    const projects = json.data?.getOrg?.projects;
    if (!projects) break;

    for (const project of projects.items) {
      const field = project.customFieldValues.find((f) => f.field?.id === CUSTOM_FIELD_IDS.PROJECT_ID);
      if (field?.textValue) existingProjectIds.push(field.textValue);
    }

    if (projects.nextOffset === null || projects.nextOffset === undefined) break;
    offset = projects.nextOffset;
  }

  return NextResponse.json({ projectIds: existingProjectIds });
}
