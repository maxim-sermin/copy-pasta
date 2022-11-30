import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import Compressor from 'compressorjs';
import {DomSanitizer} from "@angular/platform-browser";
import {EditorDialogData} from "../../services/application.service";

@Component({
  selector: 'app-image-editor-dialog',
  templateUrl: './image-editor-dialog.component.html',
  styleUrls: ['./image-editor-dialog.component.scss']
})
export class ImageEditorDialogComponent implements OnInit, AfterViewInit {

  public TARGET_WIDTH_PIXEL = 2048;

  public blobURL;
  private blob;
  public compressedSize = 0;
  public quality = 80;
  public resolutionFactor = 1;
  public imageInitialWidth: number;
  private compressionSettingsChanged = true;

  @ViewChild('preview') previewImage: ElementRef<HTMLImageElement>;

  constructor(public dialogRef: MatDialogRef<ImageEditorDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: EditorDialogData, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const self = this;
    this.previewImage.nativeElement.onload = function() {
      if (self.imageInitialWidth === undefined) {
        const imageElement = this as HTMLImageElement;
        self.resolutionFactor = self.TARGET_WIDTH_PIXEL / imageElement.naturalWidth;
        if (self.resolutionFactor > 1) {
          self.resolutionFactor = 1;
          self.compressionSettingsChanged = false;
        }
        if (self.compressedSize < self.data.maxAllowedSize) {
          self.quality = 100;
          self.compressionSettingsChanged = false;
        }
        self.imageInitialWidth = imageElement.naturalWidth;
        self.compress();
      }
    }
    this.compress();
  }

  public handleCompressionSettingsChanged(): void {
    this.compressionSettingsChanged = true;
    this.compress();
  }

  private compress(): void {
    new Promise((resolve, reject) => {
      new Compressor(this.data.fileToUpload.file, {
        strict: true,
        checkOrientation: true,
        quality: this.quality / 100,
        width: this.imageInitialWidth * this.resolutionFactor,
        convertSize: this.data.maxAllowedSize,
        success: resolve,
        error: reject
      });
    }).then(result => {
      this.blob = result as Blob;
      let objectURL = URL.createObjectURL(this.blob);
      this.compressedSize = this.blob.size;
      this.blobURL = this.sanitizer.bypassSecurityTrustUrl(objectURL);
    });
  }

  public colorGradient(fadeFraction: number, rgbColor1: Color, rgbColor2: Color): string {
    const diffRed = rgbColor2.red - rgbColor1.red;
    const diffGreen = rgbColor2.green - rgbColor1.green;
    const diffBlue = rgbColor2.blue - rgbColor1.blue;

    const gradient = {
      red: parseInt(Math.floor(rgbColor1.red + (diffRed * fadeFraction)).toString(), 10),
      green: parseInt(Math.floor(rgbColor1.green + (diffGreen * fadeFraction)).toString(), 10),
      blue: parseInt(Math.floor(rgbColor1.blue + (diffBlue * fadeFraction)).toString(), 10),
    };

    return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
  }

  public confirmEditing(): void {
    if (this.compressionSettingsChanged) { // this leaves the original bytes if image was e.g. only rotated
      this.data.fileToUpload.compressedData = this.blob;
    }
    this.dialogRef.close(true);
  }
}

interface Color {
  red: number;
  green: number;
  blue: number;
}
