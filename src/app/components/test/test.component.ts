import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
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
      this.router.navigate(['test', 'result', response.job_id]);
    })
  }
}
