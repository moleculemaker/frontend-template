import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TestService } from '~/app/services/test.service';
import { provideEnvironmentServiceStub } from '~/app/testing/environment-service.stub';
import { TestResultComponent } from './test-result.component';

/**
 * The result page and the loading screen it shows must share one status poll.
 * <app-loading> used to extend JobResult and run its own, doubling the requests.
 */
describe('TestResultComponent status polling', () => {
  it('makes one status request per poll while the loading screen is shown', fakeAsync(() => {
    const service = jasmine.createSpyObj<TestService>('TestService', ['getJob', 'getResults']);
    service.getJob.and.callFake(() => of({ tool: 'job-template-sample', status: 'processing' } as any));

    TestBed.configureTestingModule({
      imports: [TestResultComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
                  provideEnvironmentServiceStub(), { provide: TestService, useValue: service }],
    });
    const fixture: ComponentFixture<TestResultComponent> = TestBed.createComponent(TestResultComponent);
    fixture.componentInstance.currentPage = 'result';
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-loading')).not.toBeNull();
    expect(service.getJob).toHaveBeenCalledTimes(1);

    tick(10000);
    expect(service.getJob).toHaveBeenCalledTimes(2);

    fixture.destroy();
  }));

  it('stops polling once the page is destroyed', fakeAsync(() => {
    const service = jasmine.createSpyObj<TestService>('TestService', ['getJob', 'getResults']);
    service.getJob.and.callFake(() => of({ tool: 'job-template-sample', status: 'processing' } as any));

    TestBed.configureTestingModule({
      imports: [TestResultComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
                  provideEnvironmentServiceStub(), { provide: TestService, useValue: service }],
    });
    const fixture: ComponentFixture<TestResultComponent> = TestBed.createComponent(TestResultComponent);
    fixture.detectChanges();
    tick(0);
    const callsBeforeDestroy = service.getJob.calls.count();

    fixture.destroy();
    tick(30000);

    // The call count is the leak check. fakeAsync (zone.js 0.15) defaults to
    // flush: true, which flushes leftover periodic timers instead of failing on them.
    expect(service.getJob).toHaveBeenCalledTimes(callsBeforeDestroy);
  }));
});
