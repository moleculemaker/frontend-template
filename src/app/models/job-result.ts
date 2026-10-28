import { timer, take, switchMap, tap, takeWhile, BehaviorSubject, filter, delay, shareReplay, catchError, retry, throwError, map, EMPTY, Observable } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { TestService } from '~/app/services/test.service';
import { APP_IDENTITY } from '~/app/app-identity';
import { Problem, TERMINAL_STATUSES } from '~/app/models/v1-job';

/** A network failure or a gateway error during a deploy: worth asking again. */
function isTransient(error: HttpErrorResponse): boolean {
    return error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504;
}

export class JobResult {
    jobId: string;

    isLoading$ = new BehaviorSubject(true); //TODO: change it to true
    resultLoaded$ = new BehaviorSubject(false);

    /** Why the job or its results could not be loaded; the page shows it instead of the loading screen. */
    loadProblem$ = new BehaviorSubject<Problem | null>(null);

    /** Stop polling and show why. /v1 errors are problem documents; anything else isn't. */
    private fail = (error: HttpErrorResponse): Observable<never> => {
        this.loadProblem$.next(error.error?.title
            ? error.error
            : { type: 'about:blank', title: 'The job could not be loaded', status: error.status });
        this.isLoading$.next(false);
        return EMPTY;
    };

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
    statusResponse$ = timer(0, 10000).pipe(
        // Ask again a couple of times on a transient error; anything else ends the poll
        switchMap(() => this.service.getJob(this.jobId).pipe(
            retry({ count: 2, delay: (error) => isTransient(error) ? timer(5000) : throwError(() => error) }),
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
        switchMap(() => this.service.getResults(this.jobId)),
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
