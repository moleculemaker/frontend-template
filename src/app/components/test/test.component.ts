import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { JobTabComponent } from "~/app/components/job-tab/job-tab.component";
import { TestService } from '~/app/services/test.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CheckboxModule,
    ButtonModule,

    JobTabComponent,
  ],
  host: {
    class: "flex flex-col h-full"
  }
})
export class TestComponent implements OnChanges {
  @Input() formValue!: any; // TODO: update type
  @Input() showJobTab = true;
  /**
   * The job id a submission resolved to, emitted just before navigating to it. The
   * result page that embeds this form needs it for the one case navigation cannot
   * cover: a resubmit that resolves to the job already on screen is a same-URL
   * navigation the router ignores.
   */
  @Output() submitted = new EventEmitter<string>();

  form = new FormGroup({
    email: new FormControl("", [Validators.email]),
    agreeToSubscription: new FormControl(false),
  });

  currentPage = 'input';

  constructor(
    private service: TestService,
    private router: Router,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formValue'] && changes['formValue'].currentValue) {
      this.form.patchValue(this.formValue);
    }
  }

  /** The request payload as the job will store it in job_info. */
  buildJobInfo(): Record<string, unknown> {
    return {
      // TODO: add job info here
    };
  }

  /**
   * True when the form would resubmit exactly the request the loaded job ran.
   * Email is a notification setting, not part of the request, so changing only it
   * does not make a new job. Only a result page hands this form a job_id, so on
   * the standalone page this is always false.
   */
  get requestUnchanged(): boolean {
    const job = this.formValue;
    if (!job?.job_id) return false;
    const { job_id, email, ...loadedJobInfo } = job;
    return stableStringify(this.buildJobInfo()) === stableStringify(loadedJobInfo);
  }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }

    // Resubmitting the loaded job's own request would only queue a duplicate of a
    // result that already exists, so return to that result instead.
    if (this.requestUnchanged) {
      this.submitted.emit(this.formValue.job_id);
      this.router.navigate(['test', 'result', this.formValue.job_id]);
      return;
    }

    this.service.createAndRunJob(
      JobType.Somn, //TODO: use the correct job type
      {
        job_info: JSON.stringify(this.buildJobInfo()),
        email: this.form.controls["email"].value || '',
      }
    ).subscribe((response) => {
      this.submitted.emit(response.job_id);
      this.router.navigate(['test', 'result', response.job_id]);
    })
  }
}

/** JSON with keys sorted at every level, so two equal payloads compare equal regardless of key order. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as object).sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}
