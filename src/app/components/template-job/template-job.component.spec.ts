import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateJobComponent } from './template-job.component';

describe('TemplateJobComponent', () => {
  let component: TemplateJobComponent;
  let fixture: ComponentFixture<TemplateJobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateJobComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
