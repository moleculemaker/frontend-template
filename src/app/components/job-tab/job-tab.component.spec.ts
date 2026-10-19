import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideEnvironmentServiceStub } from '~/app/testing/environment-service.stub';

import { JobTabComponent } from './job-tab.component';

describe('JobTabComponent', () => {
  let component: JobTabComponent;
  let fixture: ComponentFixture<JobTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobTabComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideEnvironmentServiceStub()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
