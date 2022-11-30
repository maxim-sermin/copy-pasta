import {Directive, Output, EventEmitter, HostBinding, HostListener, Input} from '@angular/core';

@Directive({
  selector: '[appDragDrop]'
})
export class DragDropDirective {

  private defaultColor= "#f6fefa";
  private defaultOpacity = "1";
  @Output() onFileDropped = new EventEmitter<any>();

  @HostBinding('style.background-color') private background = this.defaultColor;
  @HostBinding('style.opacity') private opacity = this.defaultOpacity;
  @Input()
  private acceptImageTypes: string[] = [];

  //Dragover listener
  @HostListener('dragover', ['$event']) onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#fdf8e2';
    this.opacity = '0.6'
  }

  //Dragleave listener
  @HostListener('dragleave', ['$event']) public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = this.defaultColor;
    this.opacity = this.defaultOpacity;
  }

  //Drop listener
  @HostListener('drop', ['$event']) public ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = this.defaultColor;
    this.opacity = this.defaultOpacity;

    let filteredFiles = [];
    for (const file of evt.dataTransfer.files) {
      if (this.acceptImageTypes.includes(file.type)) {
        filteredFiles.push(file);
      }
    }

    if (filteredFiles.length > 0) {
      this.onFileDropped.emit(filteredFiles)
    }
  }
}
