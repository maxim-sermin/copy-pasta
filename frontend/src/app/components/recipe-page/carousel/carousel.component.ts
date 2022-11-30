import {
  AfterViewInit,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { CarouselItemDirective } from './carousel-item.directive';
import { animate, AnimationBuilder, AnimationFactory, AnimationPlayer, style } from '@angular/animations';
import {SmoothProgressBarComponent} from "../../smooth-progress-bar/smooth-progress-bar.component";

@Directive({
  selector: '.carousel-item'
})
export class CarouselItemElement {
}

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements AfterViewInit {
  @ContentChildren(CarouselItemDirective) items : QueryList<CarouselItemDirective>;
  @ViewChildren(CarouselItemElement, { read: ElementRef }) private itemsElements : QueryList<ElementRef>;
  @ViewChild('carousel') private carousel : ElementRef;
  @ViewChild(SmoothProgressBarComponent) progressBar: SmoothProgressBarComponent;
  private timing = '250ms ease-in';
  private player : AnimationPlayer;
  private itemWidth : number;
  public currentSlide = 0;
  carouselWrapperStyle = {};

  constructor( private builder : AnimationBuilder, private renderer: Renderer2) {
  }

  ngAfterViewInit() {
    // for some reason setTimeout is needed here
    setTimeout(() => {
      let w: string = (this.itemsElements.length * 100) + '%';
      this.renderer.setStyle(this.carousel.nativeElement, 'width', w);
      let slideWidthInContainer: string = (100 / this.itemsElements.length) + '%';
      this.itemWidth = (100 / this.itemsElements.length);
      this.itemsElements.forEach(el => {
        this.renderer.setStyle(el.nativeElement, 'width', slideWidthInContainer);
      });

      this.carouselWrapperStyle = {
        width: `100%`
      }
    });

    if (this.items.length > 1) {
      this.progressBar.startAnimation();
    }
  }

  private stopAutoPlay() {
    this.progressBar.stopAnimation();
  }

  public nextButton() {
    this.stopAutoPlay();
    this.next();
  }

  public previousButton() {
    this.stopAutoPlay();
    this.prev();
  }

  public goToSlideButton(slideIndex: number) {
    this.stopAutoPlay();
    this.currentSlide = slideIndex;
    this.scrollToSlide();
  }

  public next() {
    this.currentSlide = (this.currentSlide + 1) % this.items.length;
    this.scrollToSlide();
  }

  private prev() {
    this.currentSlide = ((this.currentSlide - 1) + this.items.length) % this.items.length;
    this.scrollToSlide();
  }

  private scrollToSlide() {
    const offset = this.currentSlide * this.itemWidth;
    const myAnimation : AnimationFactory = this.buildAnimation(offset);
    this.player = myAnimation.create(this.carousel.nativeElement);
    this.player.play();
  }

  private buildAnimation( offset ) {
    return this.builder.build([
      animate(this.timing, style({ transform: `translateX(-${offset}%)` }))
    ]);
  }
}
