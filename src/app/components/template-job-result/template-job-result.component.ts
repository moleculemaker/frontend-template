import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { JobType } from '~/app/api/mmli-backend/v1';
import { JobResult } from '~/app/models/job-result';
import { TestService } from '~/app/services/test.service';
import { LoadingComponent } from '~/app/components/loading/loading.component';

@Component({
  selector: 'app-template-job-result',
  templateUrl: './template-job-result.component.html',
  styleUrls: ['./template-job-result.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LoadingComponent,
  ],
  host: {
    class: 'flex flex-col h-full',
  }
})
export class TemplateJobResultComponent extends JobResult {
  override jobId: string = this.route.snapshot.paramMap.get("id") || "example-id";
  override jobType: JobType; //TODO: use the correct job type
  
  response$ = this.jobResultResponse$;

  constructor(
    service: TestService,
    private route: ActivatedRoute,
  ) {
    super(service);
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
