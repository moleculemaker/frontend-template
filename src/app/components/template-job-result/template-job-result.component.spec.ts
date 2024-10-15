import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateJobResultComponent } from './template-job-result.component';

describe('TemplateJobResultComponent', () => {
  let component: TemplateJobResultComponent;
  let fixture: ComponentFixture<TemplateJobResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateJobResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateJobResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
