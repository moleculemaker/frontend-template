import { Component, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, combineLatest, interval, map, Observable } from "rxjs";
import { NgIf, AsyncPipe } from "@angular/common";
import { ProgressBarModule } from "primeng/progressbar";

import { Job, JobStatus } from "~/app/api/mmli-backend/v1";

@Component({
    selector: "app-loading",
    templateUrl: "./loading.component.html",
    styleUrls: ["./loading.component.scss"],
    host: {
        class: "grow",
    },
    standalone: true,
    imports: [
        NgIf,
        ProgressBarModule,
        AsyncPipe,
    ],
})
export class LoadingComponent implements OnInit {
  // The page's own status poll (JobResult.statusResponse$), so the page polls once
  @Input({ required: true }) status$: Observable<Job>;

  estimatedTime: number;
  estimatedTimeString: string;
  showError$ = new BehaviorSubject(false);

  form = new FormGroup({
    agreeToSubscription: new FormControl(false),
    subscriberEmail: new FormControl("", [Validators.required, Validators.email]),
  });

  value$: Observable<number>;

  private progress$() {
    return combineLatest([
    this.status$,
    interval(1000),
  ]).pipe(
    map(([status, _]) => {
      //TODO: queued job should return 0, wait for backend to fix the status error
      switch (status.phase) {

        case JobStatus.Queued:
        case JobStatus.Processing:
          const jobStartedMs = (status.time_created || 0) * 1000; // use created time for estimation for now
          const jobElapsedMs = Date.now() - jobStartedMs;
          const coe = 2 / 5;
          const estimatedMs = this.estimatedTime * 1000;
          const decimalTime = (jobElapsedMs % estimatedMs) / estimatedMs;
          const wholeTime = Math.floor(jobElapsedMs / estimatedMs);

          let sum = 0;
          let i = 1;
          while (i < wholeTime && wholeTime >= 1) {
            sum += Math.pow(coe, i);
            i++;
          }
          sum += Math.pow(coe, i) * decimalTime;
          return sum * 100;

        case JobStatus.Completed:
          return 100;

        case JobStatus.Error:
          this.showError$.next(true);
          return 0;
      }
      return 0;
    }
  ));
  }

  ngOnInit(): void {
    this.value$ = this.progress$();
    this.estimatedTime = 10 * 60;

    const hours = Math.floor(this.estimatedTime / 3600);
    const minutes = Math.floor((this.estimatedTime % 3600) / 60);
    let resultString = '';
    if (hours > 0) {
      resultString += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      resultString += `${resultString.length > 0 ? ' ' : ''}${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    this.estimatedTimeString = resultString;
  }
}
