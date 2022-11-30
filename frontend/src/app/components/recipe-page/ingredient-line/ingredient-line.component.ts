import {Component, Input, OnInit} from '@angular/core';
import {Quantity} from "../../../api/models/quantity";

@Component({
  selector: 'app-ingredient-line',
  templateUrl: './ingredient-line.component.html',
  styleUrls: ['./ingredient-line.component.scss']
})
export class IngredientLineComponent implements OnInit {

  @Input()
  public quantity: Quantity;

  constructor() { }

  ngOnInit(): void {
  }

}
