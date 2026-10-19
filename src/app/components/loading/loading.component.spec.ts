import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideEnvironmentServiceStub } from '~/app/testing/environment-service.stub';

import { of } from 'rxjs';

import { Job, JobStatus } from '~/app/api/mmli-backend/v1';
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
    fixture.componentRef.setInput('status$', of({ phase: JobStatus.Processing } as Job));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
