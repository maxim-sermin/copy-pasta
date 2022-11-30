import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-smooth-progress-bar',
  templateUrl: './smooth-progress-bar.component.html',
  styleUrls: ['./smooth-progress-bar.component.scss']
})
export class SmoothProgressBarComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  public autoPlayWaitMs;
  public progressBarProgress = 0;
  private progressBarAnimation;
  private lastFrame;
  @ViewChild('animatedBar', { read: ElementRef }) private progressBarHtmlReference : ElementRef;
  @Output() progressBarEnded = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.updateProgressBar();
  }

  ngOnDestroy(): void {
    this.stopProgressBarAnimation();
  }

  public startAnimation() {
    this.progressBarAnimation = requestAnimationFrame(this.animateProgressBar.bind(this));
  }

  public stopAnimation() {
    this.stopProgressBarAnimation();
    this.progressBarProgress = 0;
    this.updateProgressBar();
  }

  // aka Unity Update
  private animateProgressBar(now) {
    this.progressBarAnimation = requestAnimationFrame(this.animateProgressBar.bind(this));

    if (!this.lastFrame) {
      this.lastFrame = now;
    }
    const elapsed = now - this.lastFrame;

    this.progressBarProgress += elapsed / this.autoPlayWaitMs * 100;
    if (this.progressBarProgress > 100) {
      this.progressBarProgress = 0;
      this.progressBarEnded.emit(true);
    }
    this.updateProgressBar();
    this.lastFrame = now;
  }

  private stopProgressBarAnimation() {
    if (this.progressBarAnimation != null) {
      cancelAnimationFrame(this.progressBarAnimation);
      this.progressBarAnimation = null;
    }
  }

  private updateProgressBar() {
    this.progressBarHtmlReference.nativeElement.style.width = this.progressBarProgress + "%";
    //console.log(this.progressBarProgress)
  }
}
