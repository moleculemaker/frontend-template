import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, RouterModule } from '@angular/router';

// Import all commonly used services and modules
import { TestService } from '../app/services/test.service';
import { EXAMPLE_JOB, EXAMPLE_RESULTS } from '../app/services/test.examples';
import { Job, JobStatus } from '../app/models/v1-job';
import { ToolResults } from '../app/api/tool-schemas';
import { Observable, of } from 'rxjs';

type TestCase = Extract<JobStatus, 'queued' | 'error' | 'processing' | 'completed'>;

// A TestService whose job is always in one status, with the example results once completed
export class MockTestService {
  constructor(private testCase: TestCase = 'queued') { }

  setTestCase(testCase: TestCase) {
    this.testCase = testCase;
  }

  submit(): Observable<Job> {
    return this.getJob();
  }

  getJob(): Observable<Job> {
    return of({ ...EXAMPLE_JOB, status: this.testCase });
  }

  getResults(): Observable<ToolResults> {
    return of(EXAMPLE_RESULTS);
  }

  artifactUrl(jobId: string, name: string): string {
    return `#${jobId}/${name}`;
  }
}

export const sharedModules = [
    RouterModule,
    // Add other common modules
];

export const sharedProviders = [
    { provide: TestService, useClass: MockTestService },
];

export const sharedDecorators = [
    moduleMetadata({
        imports: sharedModules,
        providers: sharedProviders,
    }),
    applicationConfig({
        providers: [
            provideRouter([]),
            provideHttpClient(withInterceptorsFromDi()),
        ],
    }),
];
