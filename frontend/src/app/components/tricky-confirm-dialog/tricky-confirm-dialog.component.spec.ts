import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrickyConfirmDialogComponent } from './tricky-confirm-dialog.component';

describe('TrickyConfirmDialogComponent', () => {
  let component: TrickyConfirmDialogComponent;
  let fixture: ComponentFixture<TrickyConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrickyConfirmDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrickyConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
