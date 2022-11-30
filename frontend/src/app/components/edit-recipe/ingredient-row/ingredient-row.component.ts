import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {FormArray, Validators} from "@angular/forms";
import {BehaviorSubject} from "rxjs";
import {Unit} from "../../../api/models/unit";
import {Ingredient} from "../../../api/models/ingredient";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmDialogComponent} from "../../confirm-dialog/confirm-dialog.component";
import {NoopScrollStrategy} from "@angular/cdk/overlay";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-ingredient-row',
  templateUrl: './ingredient-row.component.html',
  styleUrls: ['./ingredient-row.component.scss']
})
export class IngredientRowComponent implements OnInit {

  @Input()
  public amounts = new FormArray([]);
  @Input()
  public units = new FormArray([]);
  @Input()
  public ingredients = new FormArray([]);
  @Input()
  public optionals = new FormArray([]);
  @Input()
  public ingredientIndex: number;
  @Input()
  private unitOptions:Unit[] = [];
  @Input()
  private ingredientOptions:Ingredient[] = [];

  @Output()
  public ingredientRemoved = new EventEmitter<number>();

  public amountPersonalPreference = false;
  filteredUnitOptions: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  filteredIngredientOptions: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor(private matDialog: MatDialog, private translate: TranslateService) { }

  ngOnInit(): void {
    if (this.ingredients.controls[this.ingredientIndex].value.length > 0 && this.amounts.controls[this.ingredientIndex].value.length < 1 && this.units.controls[this.ingredientIndex].value.length < 1) {
      this.amountPersonalPreference = true;
    }
  }

  public filterUnit() {
    this.filteredUnitOptions.next(this.filterByName(this.units.value[this.ingredientIndex], this.unitOptions));
  }

  public filterIngredient() {
    this.filteredIngredientOptions.next(this.filterByName(this.ingredients.value[this.ingredientIndex], this.ingredientOptions));
  }

  private filterByName(value: string, filterThose) {
    const filterValue = value.toLowerCase();
    return filterThose.filter(option => option.name.toLowerCase().includes(filterValue)).map(option => option.name);
  }

  public tryDeleteIngredient() {
    if (this.ingredientEmpty()) {
      this.deleteIngredient();
    } else {
      const dialogRef = this.matDialog.open(ConfirmDialogComponent, {
        scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
      });

      dialogRef.componentInstance.dialogTitle = this.translate.instant('edit.dialogs.ingredientDelete.title');
      dialogRef.componentInstance.dialogMessageFirstLine = this.translate.instant('edit.dialogs.ingredientDelete.body');

      dialogRef.afterClosed().subscribe(next => {
        if (next) {
          this.deleteIngredient();
        }
      })
    }
  }

  public toggleAmountDisabled() {
    const amountControl = this.amounts.controls[this.ingredientIndex];
    const unitControl = this.units.controls[this.ingredientIndex];

    if (this.amountPersonalPreference) {
      amountControl.clearValidators();
      unitControl.clearValidators();
      amountControl.patchValue('');
      unitControl.patchValue('');
    } else {
      amountControl.setValidators(Validators.required);
      unitControl.setValidators(Validators.required);
    }
    amountControl.updateValueAndValidity();
    unitControl.updateValueAndValidity();
    this.amounts.updateValueAndValidity();
    this.units.updateValueAndValidity();
  }

  private deleteIngredient() {
    this.ingredientRemoved.emit(this.ingredientIndex);
  }

  private ingredientEmpty(): boolean {
    return this.amounts.controls[this.ingredientIndex].value < 1 && this.units.controls[this.ingredientIndex].value < 1 && this.ingredients.controls[this.ingredientIndex].value < 1;
  }
}
