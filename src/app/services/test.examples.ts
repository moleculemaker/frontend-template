import { ToolResults } from "@api/tool-schemas";
import { Job } from "~/app/models/v1-job";

// What frontendOnly mode shows instead of calling the backend. TODO: replace with an
// example job and results for your tool. These are the sample tool's, from
// moleculemaker/job-template examples/.
export const EXAMPLE_JOB: Job = {
  job_id: 'example-id',
  tool: 'job-template-sample',
  status: 'completed',
  parent_job_id: null,
  submitted_at: '2026-10-20T12:00:00Z',
  started_at: null,
  finished_at: '2026-10-20T12:01:00Z',
  inputs: {
    sequences: [
      { id: 'insulin-b', sequence: 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT' },
      { id: 'glucagon', sequence: 'HSQGTFTSDYSKYLDSRRAQDFVQWLMNT' },
    ],
  },
};

export const EXAMPLE_RESULTS: ToolResults = {
  rows: [
    { id: 'insulin-b', length: 30, molecular_weight_da: 3429.96 },
    { id: 'glucagon', length: 29, molecular_weight_da: 3482.79 },
  ],
  artifacts: [
    { name: 'results.csv', media_type: 'text/csv', description: 'All rows as CSV' },
  ],
};
