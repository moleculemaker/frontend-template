import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { FontMatchComponent } from './font-match.component';

describe('FontMatchComponent', () => {
  let component: FontMatchComponent;
  let fixture: ComponentFixture<FontMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FontMatchComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(FontMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
