import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientLineComponent } from './ingredient-line.component';

describe('IngredientLineComponent', () => {
  let component: IngredientLineComponent;
  let fixture: ComponentFixture<IngredientLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IngredientLineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IngredientLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
