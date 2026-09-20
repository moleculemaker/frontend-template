import { timer, take, switchMap, tap, takeWhile, BehaviorSubject, filter, map, delay, shareReplay } from "rxjs";
import { JobStatus, JobType } from "~/app/api/mmli-backend/v1";
import { TestService } from '~/app/services/test.service';

export class JobResult {
    jobId: string;
    jobType: JobType;

    isLoading$ = new BehaviorSubject(true); //TODO: change it to true
    resultLoaded$ = new BehaviorSubject(false);

    /**
     * One shared poll: every consumer (template `| async`, jobResultResponse$, the
     * loading component) rides this one subscription. Before, the stream was cold
     * and jobResultResponse$ gated on a second copy of it through skipUntil, so
     * two independent polls raced for the terminal status. skipUntil subscribes
     * the gate first, then the source; if the source's request came back
     * "completed" before the gate's, takeWhile completed the source with the gate
     * still closed, and jobResultResponse$ completed without ever fetching.
     * refCount lets the poll stop when nothing is listening.
     */
    statusResponse$ = timer(0, 10000).pipe(
        switchMap(() => this.service.getResultStatus(
            this.jobType,
            this.jobId,
        )),
        tap(() => this.resultLoaded$.value ? null : this.isLoading$.next(true)),
        takeWhile((data) =>
            data.phase === JobStatus.Processing
            || data.phase === JobStatus.Queued
            , true),
        tap((data) => { console.log('job status: ', data) }),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Completion is read off the shared poll (filter + take(1)), so the result is
    // fetched exactly once and no second poll can miss the terminal status.
    jobResultResponse$ = this.statusResponse$.pipe(
        filter((job) => job.phase === JobStatus.Completed),
        take(1),
        switchMap(() => this.service.getResult(this.jobType, this.jobId)),
        delay(1000),
        tap(() => this.isLoading$.next(false)),
        tap(() => this.resultLoaded$.next(true)),
        tap((data) => { console.log('result: ', data) }),
        shareReplay(1),
    );

    constructor(
        public service: TestService,
    ) { }
}