import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ActivatedRoute, Params, Router} from "@angular/router";
import {RecipesService} from "../../services/recipes.service";
import {Recipe} from "../../api/models/recipe";
import {ApplicationService} from "../../services/application.service";
import {NoopScrollStrategy} from "@angular/cdk/overlay";
import {MatDialog} from "@angular/material/dialog";
import {ImagePopupComponent} from "./image-popup/image-popup.component";
import {CarouselComponent} from "./carousel/carousel.component";
import {AuthenticationService} from "../../services/authentication.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CommentComponent} from "./comment/comment.component";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-recipe-page',
  templateUrl: './recipe-page.component.html',
  styleUrls: ['./recipe-page.component.scss']
})
export class RecipePageComponent implements OnInit {

  public currentRecipe: Recipe = {};
  public imagesToShow: any[] = [];
  public likeStatus: boolean;
  public amountLikes: number;
  @ViewChild(CarouselComponent) carousel: CarouselComponent;
  @ViewChild('commentFormPlaceholder') commentFormPlaceholder: CommentComponent;
  @Output()
  public commentUpdated = new EventEmitter<number>();

  constructor(private route: ActivatedRoute, private router: Router, private recipesService: RecipesService, public applicationService: ApplicationService, private dialog: MatDialog, public authenticationService: AuthenticationService, private snackbar: MatSnackBar, private translate: TranslateService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.loadOrRedirect(params);
    });
  }

  private loadOrRedirect(params: Params) {
    this.recipesService.getRecipeById(params.id).subscribe(next => {
      if (next == null) { // went to non-existing recipe -> go back to landing
        this.router.navigate(['/overview']);
        return;
      }

      this.currentRecipe = next;

      for (const pic of this.currentRecipe.pics) {
        this.applicationService.getImage(pic.id).subscribe(next => {
          this.createImageFromBlob(next);
        }, error => {
          console.log(error);
        });
      }

      this.currentRecipe.steps.sort(RecipesService.compareStepsQuantities);
      this.currentRecipe.quantities.sort(RecipesService.compareStepsQuantities);

      this.amountLikes = this.currentRecipe.likesAmount;
      this.recipesService.getLikeStatus(this.currentRecipe.id).subscribe(next => {
        this.likeStatus = next;
      }, error => {
        console.log(`Could not get like status for recipe "${this.currentRecipe.name}"`);
      })

      this.sortCommentsNewestOnTop();
    }, error => {
      // went to non-existing recipe -> go back to landing
      this.router.navigate(['/overview']);
      return;
    });
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.imagesToShow.push(reader.result);
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  public openImageFullscreen() {
    this.dialog.open(ImagePopupComponent, {
      scrollStrategy: new NoopScrollStrategy(), // this is super important now! without it pages with scroll will get squashed!
      position: {
        left: '4vw',
        top: '4vh'
      },
      minWidth: '92vw',
      height: '92vh',
      data: {
        images: this.imagesToShow,
        metaInfos: this.currentRecipe.pics,
        current: this.carousel.currentSlide
      },
      panelClass: 'image-popup'
    })
  }

  public handleLike() {
    this.recipesService.toggleLike(!this.likeStatus, this.currentRecipe.id).subscribe(next => {
      // faking update
      if (this.likeStatus) {
        this.amountLikes--;
      } else {
        this.amountLikes++;
      }
      this.likeStatus = !this.likeStatus;
    }, error => {
      console.log("Could not toggle like: ", error);
    })
  }

  public handleCommentAdded(commentText: string) {
    this.recipesService.addComment(commentText, this.currentRecipe.id).subscribe(next => {
      // it would be cleaner here to also fake 'this.currentRecipe.lastModifiedAt' but its quite the hassle to build that in JS
      this.commentFormPlaceholder.commentContent.reset();
      this.currentRecipe.comments.push(next);
      this.sortCommentsNewestOnTop();
    }, error => {
      this.snackbar.open(this.translate.instant('recipe.comments.comment') + ' ' + this.translate.instant('recipe.comments.snack.couldNotPost'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
    })
  }

  public handleCommentUpdated(commentIdAndContent: any) {
    const commentId = commentIdAndContent['id'];
    const commentContent = commentIdAndContent['content'];
    this.recipesService.updateComment(commentId, commentContent).subscribe(next => {
      this.updateCommentInList(commentId, commentContent);
      this.commentUpdated.emit(commentId);
    }, error => {
      this.snackbar.open(this.translate.instant('recipe.comments.comment') + ' ' + this.translate.instant('generic.couldNotUpdate.singular'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
    })
  }

  public handleCommentDeleted(commentId: number) {
    this.recipesService.deleteComment(commentId).subscribe(next => {
      this.removeCommentFromList(commentId);
    }, error => {
      this.snackbar.open(this.translate.instant('recipe.comments.comment') + ' ' + this.translate.instant('generic.couldNotDelete.singular'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
    })
  }

  public hasRecipeOptionalIngredients(): boolean {
    for (const quantity of this.currentRecipe.quantities) {
      if (quantity.optional) {
        return true;
      }
    }
    return false;
  }

  private sortCommentsNewestOnTop() {
    this.currentRecipe.comments.sort((a, b) => Date.parse(b.commentTime) - Date.parse(a.commentTime));
  }

  private removeCommentFromList(commentId: number) {
    const commentIndex = this.findCommentIndexById(commentId);
    if (commentIndex >= 0) {
      this.currentRecipe.comments.splice(commentIndex, 1);
    }
  }

  private updateCommentInList(commentId: number, newContent: string) {
    const commentIndex = this.findCommentIndexById(commentId);
    if (commentIndex >= 0) {
      this.currentRecipe.comments[commentIndex].content = newContent;
    }
  }

  private findCommentIndexById(commentId: number) {
    for (let i = 0; i < this.currentRecipe.comments.length; i++) {
      if (commentId === this.currentRecipe.comments[i].id) {
        return i;
      }
    }
    return -1;
  }
}
