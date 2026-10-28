import { timer, take, switchMap, exhaustMap, tap, takeWhile, BehaviorSubject, filter, delay, shareReplay, catchError, retry, throwError, map, timeout, defer, EMPTY, Observable, TimeoutError } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { TestService } from '~/app/services/test.service';
import { APP_IDENTITY } from '~/app/app-identity';
import { Problem, TERMINAL_STATUSES, isProblemDocument } from '~/app/models/v1-job';

/**
 * A network failure, a request that took longer than a poll, or a gateway error during
 * a deploy: worth asking again. The backend's own errors are problem documents, and
 * those are final, including its 502 "Job produced invalid results".
 */
function isTransient(error: unknown): boolean {
    if (error instanceof TimeoutError) return true;
    return error instanceof HttpErrorResponse
        && [0, 502, 503, 504].includes(error.status) && !isProblemDocument(error.error);
}

const POLL_MS = 10000;

/** Clearly shorter than POLL_MS: with exhaustMap, a tick that arrives while a request is open is dropped. */
const REQUEST_TIMEOUT_MS = 8000;

/** A results download can be large, but a stalled one must still end. */
const RESULTS_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * The page gives up on the third poll in a row that fails transiently: 20 s after the
 * first failure when they fail fast, 28 s in when no request answers (the polls at 0,
 * 10 and 20 s each time out after REQUEST_TIMEOUT_MS).
 */
const TRANSIENT_POLLS = 3;

export class JobResult {
    jobId: string;

    isLoading$ = new BehaviorSubject(true); //TODO: change it to true
    resultLoaded$ = new BehaviorSubject(false);

    /** Why the job or its results could not be loaded; the page shows it instead of the loading screen. */
    loadProblem$ = new BehaviorSubject<Problem | null>(null);

    /** Stop polling and show why. /v1 errors are problem documents; anything else isn't. */
    private fail = (error: unknown): Observable<never> => {
        this.loadProblem$.next(error instanceof HttpErrorResponse && isProblemDocument(error.error)
            ? error.error
            // a gateway page, a network failure, or the poll timeout
            : { type: 'about:blank', title: 'The job could not be loaded',
                status: error instanceof HttpErrorResponse ? error.status : 0 });
        this.isLoading$.next(false);
        return EMPTY;
    };

    /** Polls in a row that failed transiently; reset when the poll (re)starts or succeeds. */
    private transientFailures = 0;

    /**
     * One shared poll: every consumer (template `| async`, jobResultResponse$, and
     * <app-loading>, which receives this stream as its status$ input) rides this
     * one subscription. Before, the stream was cold
     * and jobResultResponse$ gated on a second copy of it through skipUntil, so
     * two independent polls raced for the terminal status. skipUntil subscribes
     * the gate first, then the source; if the source's request came back
     * "completed" before the gate's, takeWhile completed the source with the gate
     * still closed, and jobResultResponse$ completed without ever fetching.
     * refCount lets the poll stop when nothing is listening.
     */
    statusResponse$ = defer(() => {
        // refCount restarts the poll after every consumer has left, e.g. while the
        // Input tab is open; a fresh poll starts its count afresh
        this.transientFailures = 0;
        return timer(0, POLL_MS);
    }).pipe(
        // A transient error skips this poll and the next tick asks again. The count runs
        // across ticks, so a lasting outage still ends the poll; anything else ends it now.
        // exhaustMap, not switchMap, so a slow request is not cancelled by the next tick
        // before its failure is counted; timeout bounds one that never answers.
        exhaustMap(() => this.service.getJob(this.jobId).pipe(
            timeout(REQUEST_TIMEOUT_MS),
            tap(() => this.transientFailures = 0),
            catchError((error: unknown) =>
                isTransient(error) && ++this.transientFailures < TRANSIENT_POLLS ? EMPTY : throwError(() => error)),
        )),
        // /v1 job ids are global, so /result/<id> can name another tool's job, whose
        // inputs and results this page can't render
        map((job) => {
            if (job.tool !== APP_IDENTITY.jobType) {
                throw new HttpErrorResponse({ status: 404, error: {
                    type: 'about:blank', status: 404,
                    title: 'This job belongs to another tool',
                    detail: `Job ${job.job_id} was run by ${job.tool}.`,
                } });
            }
            return job;
        }),
        catchError(this.fail),
        tap(() => this.resultLoaded$.value ? null : this.isLoading$.next(true)),
        takeWhile((job) => !TERMINAL_STATUSES.includes(job.status), true),
        tap((data) => { console.log('job status: ', data) }),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Completion is read off the shared poll (filter + take(1)), so the result is
    // fetched exactly once and no second poll can miss the terminal status.
    jobResultResponse$ = this.statusResponse$.pipe(
        filter((job) => job.status === 'completed'),
        take(1),
        switchMap(() => this.service.getResults(this.jobId).pipe(
            timeout(RESULTS_TIMEOUT_MS),
            retry({ count: 2, delay: (error) => isTransient(error) ? timer(5000) : throwError(() => error) }),
        )),
        catchError(this.fail),
        delay(1000),
        tap(() => this.isLoading$.next(false)),
        tap(() => this.resultLoaded$.next(true)),
        tap((data) => { console.log('result: ', data) }),
        // refCount, or this keeps the status poll above subscribed after the page is gone
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    constructor(
        public service: TestService,
    ) { }
}
