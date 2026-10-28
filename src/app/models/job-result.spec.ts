import { fakeAsync, tick } from '@angular/core/testing';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { JobResult } from './job-result';
import { JobStatus } from '~/app/models/v1-job';

/**
 * The polling lifecycle: one shared poll, the result fetched exactly once when the
 * job completes, loading left up on error so <app-loading> can show its error state.
 */
const DELAY_MS = 1000; // the delay() applied to the result in jobResultResponse$

function makeJobResult(statuses: JobStatus[], resultValue: any = {}) {
  let call = 0;
  const service: any = {
    getJob: jasmine.createSpy('getJob')
      .and.callFake(() => of({ tool: 'job-template-sample', status: statuses[Math.min(call++, statuses.length - 1)] })),
    getResults: jasmine.createSpy('getResults').and.returnValue(of(resultValue)),
  };
  const jr = new JobResult(service);
  jr.jobId = 'job-1';
  return { jr, service };
}

describe('JobResult polling lifecycle', () => {
  it('clears loading and fetches the result exactly once when the job completes', fakeAsync(() => {
    const { jr, service } = makeJobResult(['queued', 'processing', 'completed']);
    let loading = true;
    jr.isLoading$.subscribe((v) => (loading = v));
    jr.jobResultResponse$.subscribe();

    tick(0);       // poll 1: queued
    expect(loading).toBeTrue();
    tick(10000);   // poll 2: processing
    expect(service.getResults).not.toHaveBeenCalled();
    tick(10000);   // poll 3: completed, fetch
    tick(DELAY_MS + 1);

    expect(service.getResults).toHaveBeenCalledTimes(1);
    expect(loading).toBeFalse();
  }));

  it('stops polling and fetches nothing when the job is canceled', fakeAsync(() => {
    const { jr, service } = makeJobResult(['queued', 'canceled']);
    jr.jobResultResponse$.subscribe();

    tick(0);
    tick(10000);
    tick(30000);

    expect(service.getJob).toHaveBeenCalledTimes(2);
    expect(service.getResults).not.toHaveBeenCalled();
  }));

  it('keeps loading and does not fetch a result when the job errors', fakeAsync(() => {
    const { jr, service } = makeJobResult(['processing', 'error']);
    let loading = true;
    jr.isLoading$.subscribe((v) => (loading = v));
    jr.jobResultResponse$.subscribe();

    tick(0);
    tick(10000);
    tick(DELAY_MS + 1);

    expect(service.getResults).not.toHaveBeenCalled();
    expect(loading).toBeTrue();
  }));

  it('handles an already-completed first poll', fakeAsync(() => {
    const { jr, service } = makeJobResult(['completed']);
    let loading = true;
    jr.isLoading$.subscribe((v) => (loading = v));
    jr.jobResultResponse$.subscribe();

    tick(0);
    tick(DELAY_MS + 1);

    expect(service.getResults).toHaveBeenCalledTimes(1);
    expect(loading).toBeFalse();
  }));

  it('runs one poll no matter how many consumers subscribe', fakeAsync(() => {
    // The header, the loading screen (via its status$ input) and the result
    // pipeline all read the status.
    // Before the stream was shared, each started its own timer and its own
    // requests, and the result gate could miss the terminal status.
    const { jr, service } = makeJobResult(['completed']);
    jr.statusResponse$.subscribe();
    jr.statusResponse$.subscribe();
    jr.jobResultResponse$.subscribe();

    tick(0);
    tick(DELAY_MS + 1);

    expect(service.getJob).toHaveBeenCalledTimes(1);
    expect(service.getResults).toHaveBeenCalledTimes(1);
  }));
});

describe('JobResult when the backend cannot be reached', () => {
  const job = { job_id: 'job-1', tool: 'job-template-sample', status: 'processing' };

  /** What Angular's XHR backend reports for a network failure: status 0 and the XHR ProgressEvent. */
  const networkError = () => new HttpErrorResponse({ error: new ProgressEvent('error'), status: 0 });

  function make(getJob: () => Observable<any>) {
    const service: any = { getJob: jasmine.createSpy('getJob').and.callFake(getJob), getResults: jasmine.createSpy('getResults') };
    const jr = new JobResult(service);
    jr.jobId = 'job-1';
    return jr;
  }

  it('retries a network failure (status 0) instead of giving up at once', fakeAsync(() => {
    let calls = 0;
    const jr = make(() => ++calls === 1 ? throwError(networkError) : of(job));
    const sub = jr.statusResponse$.subscribe();
    tick(0);
    tick(10000);

    expect(jr.loadProblem$.value).toBeNull();
    sub.unsubscribe();
  }));

  it('gives up on a request that never answers', fakeAsync(() => {
    const jr = make(() => NEVER);
    const sub = jr.statusResponse$.subscribe();
    for (let i = 0; i < 6; i++) tick(10000);

    expect(jr.loadProblem$.value).not.toBeNull();
    sub.unsubscribe();
  }));

  it('starts counting failures afresh when the poll restarts', fakeAsync(() => {
    let failing = true;
    const jr = make(() => failing ? throwError(networkError) : of(job));
    let sub = jr.statusResponse$.subscribe();
    tick(0);
    tick(10000);   // two failures, one short of giving up
    sub.unsubscribe();   // e.g. the user opens the Input tab

    sub = jr.statusResponse$.subscribe();
    tick(0);       // one more failure after the restart
    expect(jr.loadProblem$.value).toBeNull();
    sub.unsubscribe();
  }));
});
