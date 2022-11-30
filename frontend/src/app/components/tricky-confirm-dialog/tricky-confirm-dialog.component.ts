import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-tricky-confirm-dialog',
  templateUrl: './tricky-confirm-dialog.component.html',
  styleUrls: ['./tricky-confirm-dialog.component.scss']
})
export class TrickyConfirmDialogComponent implements OnInit {

  public dialogTitle: string;
  public dialogMessageFirstLine: string;
  public confirmString: string;
  public confirmInput: string = '';

  constructor(public dialogRef: MatDialogRef<TrickyConfirmDialogComponent>) { }


  ngOnInit() {
  }

}
