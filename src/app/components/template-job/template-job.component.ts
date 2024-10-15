import { Component } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { JobType } from "~/app/api/mmli-backend/v1";
import { TestService } from '~/app/services/test.service';
import { InputTextModule } from "primeng/inputtext";

@Component({
  selector: 'app-template-job',
  templateUrl: './template-job.component.html',
  styleUrls: ['./template-job.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
  ],
  host: {
    class: "flex flex-col h-full"
  }
})
export class TemplateJobComponent {
  
  form = new FormGroup({
    email: new FormControl("", [Validators.email]),
    agreeToSubscription: new FormControl(false),
  });
 
  constructor(
    private service: TestService,
    private router: Router,
  ) { }

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
      this.router.navigate(['template-job', 'result', response.job_id]);
    })
  }
}
