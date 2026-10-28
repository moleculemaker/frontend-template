import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { LoadedJob, TestComponent, fromFasta, toFasta } from './test.component';
import { TestService } from '~/app/services/test.service';
import { Job } from '~/app/models/v1-job';
import { provideEnvironmentServiceStub } from '~/app/testing/environment-service.stub';

const FASTA = '>insulin-b\nFVNQHLCGSHLVEALYLVCGERGFFYTPKT\n>glucagon\nHSQGTFTSDYSKY\nLDSRRAQDFVQWLMNT';

describe('TestComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let submit: jasmine.Spy;
  let navigate: jasmine.Spy;
  let emitted: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [provideNoopAnimations(), provideEnvironmentServiceStub(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    submit = spyOn(TestBed.inject(TestService), 'submit').and.returnValue(of({ job_id: 'job-b' } as Job));
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    emitted = [];
    component.submitted.subscribe((jobId) => emitted.push(jobId));
    component.form.patchValue({ sequences: FASTA });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submits the input document, the chosen files and the email', () => {
    const file = new File(['x'], 'extra.txt');
    component.files = [file];
    component.form.patchValue({ email: 'a@b.c' });

    component.onSubmit();

    expect(submit).toHaveBeenCalledWith({ sequences: fromFasta(FASTA) }, [file], 'a@b.c');
  });

  describe('while a submission is in flight', () => {
    let response: Subject<Job>;

    beforeEach(() => {
      response = new Subject<Job>();
      submit.and.returnValue(response);
    });

    // Through the form's (ngSubmit) binding, as a double click would arrive
    const pressSubmit = () =>
      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    it('ignores a second submit, so a double click creates one job', () => {
      pressSubmit();
      pressSubmit();

      expect(submit).toHaveBeenCalledTimes(1);
    });

    it('allows submitting again after the backend refuses the input', () => {
      pressSubmit();
      response.error(new HttpErrorResponse({ status: 422, error: { title: 'Invalid input', status: 422 } }));
      pressSubmit();

      expect(submit).toHaveBeenCalledTimes(2);
    });

    it('does not navigate to the job if the user has left the page', () => {
      pressSubmit();
      fixture.destroy();
      response.next({ job_id: 'job-b' } as Job);

      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it('emits the created job id once the submission resolves, then navigates to it', () => {
    component.onSubmit();

    expect(emitted).toEqual(['job-b']);
    expect(navigate).toHaveBeenCalledWith(['result', 'job-b']);
  });

  it('shows the problem the backend reports for invalid input, and stays on the form', () => {
    submit.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 422,
      error: {
        type: 'https://mmli.fastapi.mmli2.ncsa.illinois.edu/v1/problems/invalid-input',
        title: 'Input does not match the tool schema',
        status: 422,
        errors: [{ pointer: '/sequences/0/sequence', detail: "'B' does not match" }],
      },
    })));

    component.onSubmit();
    fixture.detectChanges();

    const shown: HTMLElement = fixture.nativeElement.querySelector('[data-testid="submit-problem"]');
    expect(shown.textContent).toContain('Input does not match the tool schema');
    expect(shown.textContent).toContain('/sequences/0/sequence');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('reports a failure with no problem document, such as a network error', () => {
    submit.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    component.onSubmit();

    expect(component.problem?.title).toBe('The job could not be submitted');
  });

  describe('FASTA', () => {
    it('reads one sequence per record, joining wrapped lines', () => {
      expect(fromFasta(FASTA)).toEqual([
        { id: 'insulin-b', sequence: 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT' },
        { id: 'glucagon', sequence: 'HSQGTFTSDYSKYLDSRRAQDFVQWLMNT' },
      ]);
    });

    it('round-trips through the input document', () => {
      expect(fromFasta(toFasta({ sequences: fromFasta(FASTA) }))).toEqual(fromFasta(FASTA));
    });
  });

  describe('resubmitting a loaded job', () => {
    const loadedJob: LoadedJob = { job_id: 'job-a', inputs: { sequences: fromFasta(FASTA) } };

    beforeEach(() => {
      component.formValue = loadedJob;
      component.ngOnChanges({ formValue: new SimpleChange(null, loadedJob, true) });
    });

    it('fills the form from the job it shows', () => {
      expect(fromFasta(component.form.controls.sequences.value!)).toEqual(loadedJob.inputs.sequences);
    });

    it('returns to the loaded job instead of creating a duplicate when the request is unchanged', () => {
      expect(component.requestUnchanged).toBeTrue();

      component.onSubmit();

      expect(submit).not.toHaveBeenCalled();
      expect(emitted).toEqual(['job-a']);
      expect(navigate).toHaveBeenCalledWith(['result', 'job-a']);
    });

    // Email is a notification setting, not part of the request.
    it('treats an email-only change as the same request', () => {
      component.form.patchValue({ email: 'other@b.c' });

      expect(component.requestUnchanged).toBeTrue();
    });

    it('treats an edited input as a new request', () => {
      component.form.patchValue({ sequences: '>one\nACD' });

      expect(component.requestUnchanged).toBeFalse();
    });

    // What the job received can't be compared with a newly chosen file
    it('treats chosen files as a new request', () => {
      component.files = [new File(['x'], 'extra.txt')];

      expect(component.requestUnchanged).toBeFalse();
    });

    it('is never unchanged on the standalone page, which has no loaded job', () => {
      component.formValue = undefined;

      expect(component.requestUnchanged).toBeFalse();
    });
  });
});
