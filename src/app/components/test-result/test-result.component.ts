import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { JobType } from '~/app/api/mmli-backend/v1';
import { JobResult } from '~/app/models/job-result';
import { LoadingComponent } from '~/app/components/loading/loading.component';
import { JobTabComponent } from "~/app/components/job-tab/job-tab.component";

import { TestService } from '~/app/services/test.service';
import { TestComponent } from '~/app/components/test/test.component';

@Component({
  selector: 'app-test-result',
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LoadingComponent,

    TestComponent,
    JobTabComponent,
  ],
  host: {
    class: 'flex flex-col h-full',
  }
})
export class TestResultComponent extends JobResult {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType; //TODO: use the correct job type
  
  response$ = this.jobResultResponse$;

  currentPage = 'input';

  jobInfo: any = {};

  constructor(
    service: TestService,
    private route: ActivatedRoute,
  ) {
    super(service);
  }

  /**
   * A resubmit that resolves to another job navigates there, and the route reuse
   * strategy rebuilds this page for it. One that resolves to this same job is a
   * same-URL navigation the router ignores, so nothing else would bring the
   * results tab back.
   */
  onResubmitted(jobId: string): void {
    if (jobId === this.jobId) {
      this.currentPage = 'result';
    }
  }

  copyAndPasteURL(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }
}
