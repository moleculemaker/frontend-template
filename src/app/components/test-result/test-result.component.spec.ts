import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { TestResultComponent } from './test-result.component';
import { TestComponent } from '~/app/components/test/test.component';
import { provideEnvironmentServiceStub } from '~/app/testing/environment-service.stub';

describe('TestResultComponent', () => {
  let component: TestResultComponent;
  let fixture: ComponentFixture<TestResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestResultComponent],
      providers: [provideNoopAnimations(), provideEnvironmentServiceStub(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens on the results tab', () => {
    expect(component.currentPage).toBe('result');
  });

  describe('resubmitting from the embedded form', () => {
    it('hands the form the job id it is showing, so it can recognise an unchanged resubmit', async () => {
      await firstValueFrom(component.statusResponse$);

      expect(component.jobInfo.job_id).toBe(component.jobId);
    });

    // No route param in this fixture, so jobId falls back to the example id.
    const embeddedForm = (): TestComponent =>
      fixture.debugElement.query(By.directive(TestComponent)).componentInstance;

    beforeEach(() => {
      component.currentPage = 'input';
      fixture.detectChanges();
    });

    it('returns to the results tab when the submission resolves to the job already shown', () => {
      embeddedForm().submitted.emit(component.jobId);

      expect(component.currentPage).toBe('result');
    });

    it('leaves the tab alone for another job, which navigation handles', () => {
      embeddedForm().submitted.emit('some-other-job');

      expect(component.currentPage).toBe('input');
    });
  });
});
