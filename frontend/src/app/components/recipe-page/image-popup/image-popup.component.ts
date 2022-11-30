import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Pic} from "../../../api/models/pic";

@Component({
  selector: 'app-image-popup',
  templateUrl: './image-popup.component.html',
  styleUrls: ['./image-popup.component.scss']
})
export class ImagePopupComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: {images: ArrayBuffer[], metaInfos: Pic[], current: number}, public dialogRef: MatDialogRef<ImagePopupComponent>) { }

  ngOnInit(): void {
  }

}
