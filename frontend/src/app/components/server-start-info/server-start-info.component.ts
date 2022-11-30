import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {SmoothProgressBarComponent} from "../smooth-progress-bar/smooth-progress-bar.component";
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-server-start-info',
  templateUrl: './server-start-info.component.html',
  styleUrls: ['./server-start-info.component.scss']
})
export class ServerStartInfoComponent implements OnInit, AfterViewInit {

  public serverStarted = false;
  public usualStartTimeSeconds = 40; // 36 was median
  public wentOvertime = false;
  public autoCloseSeconds = 10;
  @ViewChild(SmoothProgressBarComponent) progressBar: SmoothProgressBarComponent;

  constructor(public dialogRef: MatDialogRef<ServerStartInfoComponent>) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.progressBar.startAnimation();
  }

  public handleServerStarted() {
    this.serverStarted = true;
    setTimeout(() => {
      this.dialogRef.close();
    }, this.autoCloseSeconds * 1000);
  }
}
