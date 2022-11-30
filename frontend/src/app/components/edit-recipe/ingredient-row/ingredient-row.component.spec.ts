import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientRowComponent } from './ingredient-row.component';

describe('IngredientRowComponent', () => {
  let component: IngredientRowComponent;
  let fixture: ComponentFixture<IngredientRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IngredientRowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IngredientRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
