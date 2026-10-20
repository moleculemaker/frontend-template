/**
 * The /v1 job resource and results envelope, as mmli-backend renders them
 * (`_job_document` and `get_results` in app/routers/v1/jobs.py).
 *
 * Written by hand: /v1's OpenAPI declares no response schemas, so the generated
 * client types every response as `any`.
 */
export type JobStatus = 'queued' | 'processing' | 'completed' | 'error' | 'canceled';

/** Statuses after which the job never changes again. */
export const TERMINAL_STATUSES: readonly JobStatus[] = ['completed', 'error', 'canceled'];

export interface Job {
  job_id: string;
  tool: string;
  status: JobStatus;
  parent_job_id: string | null;
  /** ISO 8601, UTC */
  submitted_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  /** The input document as submitted */
  inputs: unknown;
}

export interface JobResults<T> {
  job_id: string;
  tool: string;
  results: T;
}

/** An RFC 9457 problem document; every /v1 error is one. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  /** For invalid input: a JSON Pointer into the submitted document, and what is wrong there */
  errors?: { pointer: string; detail: string }[];
}
