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

  get requestUnchanged(): boolean { return false; }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }

    console.log(this.form.value);

    this.service.createAndRunJob(
      JobType.Somn, //TODO: use the correct job type
      {
        job_info: JSON.stringify({
          // TODO: add job info here
        }),
        email: this.form.controls["email"].value || '',
      }
    ).subscribe((response) => {
      this.submitted.emit(response.job_id);
      this.router.navigate(['test', 'result', response.job_id]);
    })
  }
}
