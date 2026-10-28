import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from "@angular/core";
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { CheckboxModule } from "primeng/checkbox";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";

import { ToolInput } from "@api/tool-schemas";
import { Problem, isProblemDocument } from "~/app/models/v1-job";
import { JobTabComponent } from "~/app/components/job-tab/job-tab.component";
import { TestService } from '~/app/services/test.service';

/** What a result page hands this form: the job it shows, to edit and resubmit. */
export interface LoadedJob {
  job_id: string;
  inputs: ToolInput;
}

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
  @Input() formValue?: LoadedJob;
  @Input() showJobTab = true;
  /**
   * The job id a submission resolved to, emitted just before navigating to it. The
   * result page that embeds this form needs it for the one case navigation cannot
   * cover: a resubmit that resolves to the job already on screen is a same-URL
   * navigation the router ignores.
   */
  @Output() submitted = new EventEmitter<string>();

  form = new FormGroup({
    // TODO: replace with your tool's inputs. The sample tool takes protein sequences.
    sequences: new FormControl("", [Validators.required]),
    email: new FormControl("", [Validators.email]),
    agreeToSubscription: new FormControl(false),
  });

  /** Files sent with the job, which the tool reads from its input directory. */
  files: File[] = [];

  /** The backend's reason for refusing the last submission, if it did. */
  problem: Problem | null = null;

  currentPage = 'input';

  /**
   * True from submit until the navigation to the new job settles, or the submit fails.
   * A second submit meanwhile is ignored. Clearing it when the response arrives instead
   * would let a click during the navigation create a second job.
   */
  submitting = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private service: TestService,
    private router: Router,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formValue'] && changes['formValue'].currentValue) {
      this.form.patchValue({ sequences: toFasta(this.formValue!.inputs) });
    }
  }

  onFilesSelected(event: Event): void {
    this.files = Array.from((event.target as HTMLInputElement).files ?? []);
  }

  /** The input document, exactly as the tool's input schema describes it. */
  buildInputs(): ToolInput {
    // TODO: build your tool's input document from the form
    return { sequences: fromFasta(this.form.controls.sequences.value ?? '') };
  }

  /**
   * True when the form would resubmit exactly the request the loaded job ran.
   * Email is a notification setting, not part of the request, so changing only it
   * does not make a new job. Files can't be compared with what the job received, so
   * choosing any makes it a new request. Only a result page hands this form a job,
   * so on the standalone page this is always false.
   */
  get requestUnchanged(): boolean {
    const job = this.formValue;
    if (!job?.job_id || this.files.length) return false;
    return stableStringify(this.buildInputs()) === stableStringify(job.inputs);
  }

  onSubmit() {
    if (!this.form.valid || this.submitting) {
      return;
    }

    // Resubmitting the loaded job's own request would only queue a duplicate of a
    // result that already exists, so return to that result instead.
    if (this.requestUnchanged) {
      this.submitted.emit(this.formValue!.job_id);
      this.router.navigate(['result', this.formValue!.job_id]);
      return;
    }

    this.problem = null;
    this.submitting = true;
    this.service.submit(
      this.buildInputs(),
      this.files,
      this.form.controls.email.value || '',
    ).subscribe({
      // Not cancelled when the page goes away: the backend may already have accepted
      // the upload, and cancelling would only hide the job it created. A response
      // after the user has left must not pull them back to it, though.
      next: (job) => {
        if (this.destroyRef.destroyed) return;
        this.submitted.emit(job.job_id);
        // Enabled again only once the navigation is over, or a click meanwhile resubmits
        this.router.navigate(['result', job.job_id]).finally(() => this.submitting = false);
      },
      // /v1 errors are problem documents; anything else (a network failure) isn't
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.problem = isProblemDocument(error.error)
          ? error.error
          : { type: 'about:blank', title: 'The job could not be submitted', status: error.status };
      },
    });
  }
}

/** FASTA text to the sample tool's sequences: one per record, id from the header. */
export function fromFasta(text: string): ToolInput['sequences'] {
  return text.split('>').map((record) => record.trim()).filter(Boolean).map((record) => {
    const [header, ...lines] = record.split('\n');
    return { id: header.trim(), sequence: lines.join('').replace(/\s/g, '') };
  });
}

export function toFasta(inputs: ToolInput): string {
  return inputs.sequences.map(({ id, sequence }) => `>${id}\n${sequence}`).join('\n');
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
