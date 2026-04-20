import { NextResponse } from "next/server";
import { GET_ORG_DATA_QUERY } from "~/lib/cladQueries";
import { loadLineItemConfig } from "~/lib/lineItemConfig";
import type { OrgUser, OrgLineItem } from "~/types/clad";

type GraphQLOrgResponse = {
  data?: {
    getOrg?: {
      users: OrgUser[];
      projectLabels: { id: string; name: string }[];
      lineItems: OrgLineItem[];
    };
  };
  errors?: { message: string }[];
};

export async function GET() {
  const apiKey = process.env.CLAD_API_KEY;
  const graphqlUrl = process.env.CLAD_GRAPHQL_URL;
  const lineItemConfig = loadLineItemConfig();
  const dropLineItemIds = new Set(lineItemConfig.map((item) => item.id));

  if (!apiKey || !graphqlUrl) {
    return NextResponse.json({ error: "API configuration missing" }, { status: 500 });
  }

  try {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: GET_ORG_DATA_QUERY }),
    });

    const json = (await response.json()) as GraphQLOrgResponse;

    if (json.errors?.length) {
      console.error("GraphQL errors fetching org data:", json.errors);
      return NextResponse.json({ error: json.errors[0]?.message }, { status: 500 });
    }

    const org = json.data?.getOrg;
    if (!org) {
      return NextResponse.json({ error: "No org data returned" }, { status: 500 });
    }

    return NextResponse.json({
      users: org.users,
      labels: org.projectLabels,
      lineItems: dropLineItemIds.size > 0 ? org.lineItems.filter((item) => dropLineItemIds.has(item.id)) : org.lineItems,
    });
  } catch (err) {
    console.error("Failed to fetch org data:", err);
    return NextResponse.json({ error: "Failed to fetch org data" }, { status: 500 });
  }
}
