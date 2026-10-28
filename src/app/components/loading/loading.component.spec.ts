import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideEnvironmentServiceStub } from '~/app/testing/environment-service.stub';

import { NEVER, of } from 'rxjs';

import { Job, JobStatus } from '~/app/models/v1-job';
import { LoadingComponent } from './loading.component';

describe('LoadingComponent', () => {
  let component: LoadingComponent;
  let fixture: ComponentFixture<LoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideEnvironmentServiceStub()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
  });

  function show(status: JobStatus) {
    fixture.componentRef.setInput('status$', of({ status } as Job));
    fixture.detectChanges();
  }

  const shown = (testId: string) => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  it('should create', () => {
    show('processing');
    expect(component).toBeTruthy();
  });

  it('claims neither queued nor processing before the first status arrives', () => {
    fixture.componentRef.setInput('status$', NEVER);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="job-processing"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="job-queued"]')).toBeNull();
  });

  it('says a queued job is waiting, not running', () => {
    show('queued');
    expect(shown('job-queued')).not.toBeNull();
    expect(shown('job-processing')).toBeNull();
  });

  it('shows the estimate once the job is processing', () => {
    show('processing');
    expect(shown('job-processing')).not.toBeNull();
    expect(shown('job-queued')).toBeNull();
  });

  // The terminal states are set by the progress stream, which ticks once a second
  function showAfterATick(status: JobStatus) {
    show(status);
    tick(1000);
    fixture.detectChanges();
  }

  it('shows the error and canceled states as soon as the status arrives', () => {
    show('error');
    expect(shown('job-error')).not.toBeNull();

    show('canceled');
    expect(shown('job-canceled')).not.toBeNull();
    expect(shown('job-error')).toBeNull();
  });

  it('shows the error state for a failed job', fakeAsync(() => {
    showAfterATick('error');
    expect(shown('job-error')).not.toBeNull();
    discardPeriodicTasks();
  }));

  it('shows the canceled state for a canceled job, not the error', fakeAsync(() => {
    showAfterATick('canceled');
    expect(shown('job-canceled')).not.toBeNull();
    expect(shown('job-error')).toBeNull();
    discardPeriodicTasks();
  }));
});
