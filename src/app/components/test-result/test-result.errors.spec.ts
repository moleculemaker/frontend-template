import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { defer, of, throwError } from 'rxjs';

import { TestService } from '~/app/services/test.service';
import { provideEnvironmentServiceStub } from '~/app/testing/environment-service.stub';
import { TestResultComponent } from './test-result.component';

/** A failed request, as HttpClient reports it: /v1 errors carry a problem document. */
function httpError(status: number, title?: string) {
  return new HttpErrorResponse({
    status,
    error: title ? { type: 'about:blank', title, status } : null,
  });
}

describe('TestResultComponent when a request fails', () => {
  let service: jasmine.SpyObj<TestService>;
  let fixture: ComponentFixture<TestResultComponent>;

  function create() {
    TestBed.configureTestingModule({
      imports: [TestResultComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
                  provideEnvironmentServiceStub(), { provide: TestService, useValue: service }],
    });
    fixture = TestBed.createComponent(TestResultComponent);
    fixture.detectChanges();
  }

  const shown = (testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;

  beforeEach(() => {
    service = jasmine.createSpyObj<TestService>('TestService', ['getJob', 'getResults']);
  });

  it('shows the problem instead of "Processing" when the job does not exist', fakeAsync(() => {
    service.getJob.and.returnValue(throwError(() => httpError(404, 'Unknown job')));
    create();
    tick(0);
    fixture.detectChanges();

    expect(shown('load-error')?.textContent).toContain('Unknown job');
    expect(shown('job-processing')).toBeNull();
    fixture.destroy();
  }));

  it('keeps polling through a brief outage, such as a deploy', fakeAsync(() => {
    let calls = 0;
    service.getJob.and.callFake(() => ++calls === 1
      ? throwError(() => httpError(502))
      : of({ job_id: 'j1', tool: 'job-template-sample', status: 'processing' } as any));
    create();
    tick(0);
    tick(10000);
    fixture.detectChanges();

    expect(shown('load-error')).toBeNull();
    expect(shown('job-processing')).not.toBeNull();
    fixture.destroy();
  }));

  it('gives up and shows an error when the outage lasts', fakeAsync(() => {
    service.getJob.and.returnValue(throwError(() => httpError(502)));
    create();
    tick(0);
    for (let i = 0; i < 5; i++) tick(10000);
    fixture.detectChanges();

    expect(shown('load-error')).not.toBeNull();
    expect(shown('job-processing')).toBeNull();
    fixture.destroy();
  }));

  it('retries a gateway 502 for the results, then shows them', fakeAsync(() => {
    service.getJob.and.returnValue(of({ job_id: 'j1', tool: 'job-template-sample', status: 'completed' } as any));
    // Cold, like HttpClient: each subscription is a new request
    let requests = 0;
    service.getResults.and.returnValue(defer(() => ++requests === 1
      ? throwError(() => httpError(502))   // no problem document: the gateway, not the API
      : of({ rows: [], artifacts: [] } as any)));
    create();
    tick(0);
    tick(10000);
    tick(1000);
    fixture.detectChanges();

    expect(shown('load-error')).toBeNull();
    expect(requests).toBe(2);
    fixture.destroy();
  }));

  it("says so instead of rendering another tool's job, whose inputs aren't this tool's", fakeAsync(() => {
    service.getJob.and.returnValue(of({ job_id: 'j1', tool: 'somn', status: 'processing', inputs: {} } as any));
    create();
    tick(0);
    fixture.detectChanges();

    expect(shown('load-error')?.textContent).toContain('another tool');
    expect(shown('job-processing')).toBeNull();
    fixture.destroy();
  }));

  it('shows the problem when a completed job has no usable results', fakeAsync(() => {
    service.getJob.and.returnValue(of({ job_id: 'j1', tool: 'job-template-sample', status: 'completed' } as any));
    service.getResults.and.returnValue(throwError(() => httpError(502, 'Results do not match the output schema')));
    create();
    tick(0);
    tick(1000);
    fixture.detectChanges();

    expect(shown('load-error')?.textContent).toContain('Results do not match the output schema');
    expect(shown('job-processing')).toBeNull();
    fixture.destroy();
  }));
});
