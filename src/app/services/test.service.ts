import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, map, of } from "rxjs";

import { JobsService } from "@api/v1";
import { ToolInput, ToolResults } from "@api/tool-schemas";
import { APP_IDENTITY } from "~/app/app-identity";
import { Job, JobResults } from "~/app/models/v1-job";
import { EnvironmentService } from "./environment.service";
import { EXAMPLE_JOB, EXAMPLE_RESULTS } from "./test.examples";

@Injectable({
  providedIn: "root",
})
export class TestService {
  frontendOnly = false;

  /** The mmli-backend tool this app submits to (app.yaml `job_type`). */
  readonly tool = APP_IDENTITY.jobType;

  constructor(
    private http: HttpClient,
    private jobsService: JobsService,
    private environmentService: EnvironmentService,
  ) {
    this.frontendOnly = this.environmentService.getEnvConfig().frontendOnly === "true";
  }

  /**
   * Submit a job: the input document plus any files the tool reads from its input
   * directory. Always multipart, which /v1 accepts with or without files.
   *
   * Not through the generated client: the endpoint accepts JSON or multipart, and the
   * generator emits a JSON-only method for it.
   */
  submit(inputs: ToolInput, files: File[] = [], email = ''): Observable<Job> {
    if (this.frontendOnly) {
      return of(EXAMPLE_JOB);
    }
    const body = new FormData();
    body.append('inputs', JSON.stringify(inputs));
    for (const file of files) {
      body.append('files', file, file.name);
    }
    // The address goes in a header so the body stays exactly the tool's input schema
    let headers = new HttpHeaders();
    if (email) {
      headers = headers.set('X-Notify-Email', email);
    }
    return this.http.post<Job>(`${this.basePath}/tools/${this.tool}/jobs`, body, { headers });
  }

  /** /v1's base URL, which EnvironmentService sets from envvars.json. */
  private get basePath(): string {
    return this.jobsService.configuration.basePath!;
  }

  getJob(jobId: string): Observable<Job> {
    if (this.frontendOnly) {
      return of(EXAMPLE_JOB);
    }
    return this.jobsService.getJobJobsJobIdGet(jobId);
  }

  getResults(jobId: string): Observable<ToolResults> {
    if (this.frontendOnly) {
      return of(EXAMPLE_RESULTS);
    }
    return this.jobsService.getResultsJobsJobIdResultsGet(jobId)
      .pipe(map((response: JobResults<ToolResults>) => response.results));
  }

  /** Where the backend serves one of the job's output files. */
  artifactUrl(jobId: string, name: string): string {
    return `${this.basePath}/jobs/${jobId}/artifacts/${encodeURIComponent(name)}`;
  }
}
