export const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      title
    }
  }
`;

export const GET_ORG_DATA_QUERY = `{
  getOrg {
    users {
      id
      firstName
      lastName
      email
    }
    projectLabels {
      id
      name
    }
    lineItems {
      id
      name
    }
  }
}`;

export const GET_ORG_PROJECTS_QUERY = `
  query GetOrgProjects($offset: Int!) {
    getOrg {
      projects(input: { pagination: { offset: $offset, limit: 250 } }) {
        items {
          customFieldValues {
            ... on CustomProjectTextFieldValue {
              field { id }
              textValue
            }
          }
        }
        nextOffset
      }
    }
  }
`;

export const CUSTOM_FIELD_IDS = {
  ADDRESS: "114",
  DROP_TYPE: "115",
  CITY: "116",
  PROJECT_ID: "117",
} as const;
