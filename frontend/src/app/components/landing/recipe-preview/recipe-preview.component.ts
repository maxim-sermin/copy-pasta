import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Recipe} from "../../../api/models/recipe";
import {ApplicationService} from "../../../services/application.service";

@Component({
  selector: 'app-recipe-preview',
  templateUrl: './recipe-preview.component.html',
  styleUrls: ['./recipe-preview.component.scss']
})
export class RecipePreviewComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  public recipe: Recipe;
  public imageToShow: string | ArrayBuffer;
  public isImageLoading: boolean = true;
  @ViewChild('previewChipList', {static: false, read: ElementRef}) private previewChipList : ElementRef;
  private maxScrollOffset: number;
  public currentScrollOffset = 0;
  public scrollSpeed = 0.03;
  private pingPongScrollAnimation;
  private lastFrame;
  private chipMarginPixels = 4;
  private directionReversed = false;

  constructor(public applicationService: ApplicationService) { }

  ngOnInit(): void {
   if(this.recipe.pics.length > 0){
     this.applicationService.getImage(this.recipe.pics[0].id).subscribe(next =>{
       this.createImageFromBlob(next);
       this.isImageLoading = false;
     }, error => {
       this.isImageLoading = false;
       console.log('Could not load recipe picture for recipe preview: ' + error);
     });
   }
  }

  ngAfterViewInit(): void {
    this.maxScrollOffset = this.previewChipList.nativeElement.children[0].scrollWidth - this.previewChipList.nativeElement.offsetWidth - this.chipMarginPixels;
    //console.log(this.maxScrollOffset);
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      if (image.size > 0) { // placeholder is shown when actual image is corrupted
        this.imageToShow = reader.result;
      }
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  public startAnimation() {
    if (this.maxScrollOffset > this.chipMarginPixels) { // small "error"
      this.pingPongScrollAnimation = requestAnimationFrame(this.animateScroll.bind(this));
    }
  }

  public stopAnimation() {
    if (this.pingPongScrollAnimation != null) {
      cancelAnimationFrame(this.pingPongScrollAnimation);
      this.pingPongScrollAnimation = null;
      this.directionReversed = false;
      this.currentScrollOffset = 0;
      this.lastFrame = undefined;
      this.updateScrollPosition();
    }
  }

  // aka Unity Update
  private animateScroll(now) {
    this.pingPongScrollAnimation = requestAnimationFrame(this.animateScroll.bind(this));

    if (!this.lastFrame) {
      this.lastFrame = now;
    }
    const elapsed = now - this.lastFrame;

    const x = this.currentScrollOffset / this.maxScrollOffset;
    const smoothedSpeed = (-2 * Math.pow(x, 2) + 2*x + 0.04) * 5; // mathe!!

    if (!this.directionReversed) {
      this.currentScrollOffset += elapsed * this.scrollSpeed * smoothedSpeed;
    } else {
      this.currentScrollOffset -= elapsed * this.scrollSpeed * smoothedSpeed;
    }

    if (this.currentScrollOffset > this.maxScrollOffset) {
      this.directionReversed = true;
      this.currentScrollOffset = this.maxScrollOffset;
    } else if (this.currentScrollOffset < 0) {
      this.directionReversed = false;
      this.currentScrollOffset = 0;
    }
    this.updateScrollPosition();
    this.lastFrame = now;
  }

  private updateScrollPosition() {
    this.previewChipList.nativeElement.scrollLeft = this.currentScrollOffset;
  }
}
