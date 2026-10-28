import { Component, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { combineLatest, interval, map, Observable } from "rxjs";
import { NgIf, AsyncPipe } from "@angular/common";
import { ProgressBarModule } from "primeng/progressbar";

import { Job } from "~/app/models/v1-job";

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
      switch (status.status) {

        // Waiting for a node (often the one GPU node) or its image; nothing has run yet
        case 'queued':
          return 0;

        case 'processing':
          // The backend does not record started_at yet, so fall back to submitted_at
          const jobStartedMs = Date.parse(status.started_at ?? status.submitted_at ?? '') || Date.now();
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

        case 'completed':
          return 100;

        // 'error' and 'canceled' have no progress; the template shows their own screens
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
