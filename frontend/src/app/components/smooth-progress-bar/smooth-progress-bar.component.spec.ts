import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmoothProgressBarComponent } from './smooth-progress-bar.component';

describe('SmoothProgressBarComponent', () => {
  let component: SmoothProgressBarComponent;
  let fixture: ComponentFixture<SmoothProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SmoothProgressBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmoothProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
