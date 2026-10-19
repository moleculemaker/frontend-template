import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { TestComponent } from './test.component';
import { TestService } from '~/app/services/test.service';
import { Job } from '~/app/api/mmli-backend/v1';
import { provideEnvironmentServiceStub } from '~/app/testing/environment-service.stub';

describe('TestComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let createAndRunJob: jasmine.Spy;
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

    createAndRunJob = spyOn(TestBed.inject(TestService), 'createAndRunJob').and.returnValue(of({ job_id: 'job-b' } as Job));
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    emitted = [];
    component.submitted.subscribe((jobId) => emitted.push(jobId));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits the created job id once the submission resolves, then navigates to it', () => {
    component.onSubmit();

    expect(createAndRunJob).toHaveBeenCalled();
    expect(emitted).toEqual(['job-b']);
    expect(navigate).toHaveBeenCalledWith(['test', 'result', 'job-b']);
  });
  describe('resubmitting a loaded job', () => {
    // The template's request payload is empty, so any loaded job reads as unchanged
    // until an app fills in buildJobInfo(); the compare itself is what is under test.
    const loadedJob = { job_id: 'job-a', email: 'a@b.c' };

    beforeEach(() => {
      component.formValue = loadedJob;
      component.ngOnChanges({ formValue: new SimpleChange(null, loadedJob, true) });
    });

    it('returns to the loaded job instead of creating a duplicate when the request is unchanged', () => {
      expect(component.requestUnchanged).toBeTrue();

      component.onSubmit();

      expect(createAndRunJob).not.toHaveBeenCalled();
      expect(emitted).toEqual(['job-a']);
      expect(navigate).toHaveBeenCalledWith(['test', 'result', 'job-a']);
    });

    // Email is a notification setting, not part of the request.
    it('treats an email-only change as the same request', () => {
      component.form.patchValue({ email: 'other@b.c' });

      expect(component.requestUnchanged).toBeTrue();
    });

    it('is never unchanged on the standalone page, which has no loaded job', () => {
      component.formValue = null;

      expect(component.requestUnchanged).toBeFalse();
    });
  });
});
