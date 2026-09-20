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
});
