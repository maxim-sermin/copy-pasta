import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputLengthHintComponent } from './input-length-hint.component';

describe('InputLengthHintComponent', () => {
  let component: InputLengthHintComponent;
  let fixture: ComponentFixture<InputLengthHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputLengthHintComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputLengthHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
