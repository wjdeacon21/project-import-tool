export type ProjectRow = {
  title: string;
  address: string;
  dropType: string;
  city: string;
  startDate: string;
  projectId: string;
};

export type SubmissionResult = {
  title: string;
  success: boolean;
  projectId?: string;
  error?: string;
};

export type SubmissionResponse = {
  results: SubmissionResult[];
  successCount: number;
  failureCount: number;
};

export type OrgUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type OrgLabel = {
  id: string;
  name: string;
};

export type OrgLineItem = {
  id: string;
  name: string;
};

export type OrgData = {
  users: OrgUser[];
  labels: OrgLabel[];
  lineItems: OrgLineItem[];
};
