import { Injectable } from '@angular/core';
import {RecipeEndpointService} from "../api/services/recipe-endpoint.service";
import {Observable} from "rxjs";
import {Recipe} from "../api/models/recipe";
import {tap} from "rxjs/operators";
import {Step} from "../api/models/step";
import {PageRecipe} from "../api/models/page-recipe";
import {ApplicationService} from "./application.service";
import {Quantity} from "../api/models/quantity";

@Injectable({
  providedIn: 'root'
})
export class RecipesService {

  private PAGE_SIZE = 10;
  private recipeRevealTimeMax = 310;

  public recipes: Recipe[] = [];
  public recipesRevealTimes: number[] = [];
  private nextPageIndex = 0;
  public reachedEnd = false;
  public refreshRunning;
  constructor(private recipeEndpointService:RecipeEndpointService) { }

  public refreshRecipes(filterRecipeName: string, filterLabelNames: string[], filterIngredientNames: string[], sortByLikes: boolean, sortAscending: boolean): Observable<PageRecipe> | null {
    if (!this.reachedEnd && !this.refreshRunning) {
      this.refreshRunning = true;
      //console.log("Requesting page " + this.nextPageIndex);
      return this.recipeEndpointService.getAllRecipesUsingGET({recipeName: filterRecipeName, labelNames: filterLabelNames, ingredientNames: filterIngredientNames, page: this.nextPageIndex, size: this.PAGE_SIZE, sortByLikes: sortByLikes, sortAscending: sortAscending}).pipe(tap(next => {
        this.refreshRunning = false;
        //console.log(`Got ${next.content.length} recipes while having ${this.recipes.length} still cached locally`);
        for (const recipe of next.content) {
          this.recipes.push(recipe);
          this.recipesRevealTimes.push(ApplicationService.getRandomInt(this.recipeRevealTimeMax));
        }
        this.nextPageIndex++;
        if (next.last) {
          this.reachedEnd = true;
        }
      }, error => {
        this.refreshRunning = false;
      }));
    }
  }

  public resetService(): void {
    this.recipes = [];
    this.recipesRevealTimes = [];
    this.nextPageIndex = 0;
    this.reachedEnd = false;
    //console.log(`Just reset recipe service (now contains ${this.recipes.length} recipes)`);
  }

  public addRecipe(newRecipe:Recipe): Observable<number>{
    return this.recipeEndpointService.addRecipeUsingPOST({newRecipe});
  }

  public updateRecipe(existingRecipe: Recipe): Observable<number> {
    return this.recipeEndpointService.updateRecipeUsingPUT({changedRecipe: existingRecipe});
  }

  public deleteRecipe(existingRecipeId: number) {
    return this.recipeEndpointService.deleteRecipeUsingDELETE({id: existingRecipeId});
  }

  public deleteImages(recipeId: number, deleteImageIds: number[]) {
    return this.recipeEndpointService.deleteImagesFromRecipeUsingDELETE({id: recipeId, imageIds: deleteImageIds});
  }

  public getRecipeNames(): Observable<string[]> {
    return this.recipeEndpointService.getAllRecipeNamesUsingGET();
  }

  public getRecipeById(id: number): Observable<Recipe> {
    for (const recipe of this.recipes) {
      if (recipe.id == id) {
        return new Observable(subscriber => {
          subscriber.next(recipe)
        })
      }
    }
    return this.recipeEndpointService.getSingleByIdUsingGET(id);
  }

  public refreshRecipeById(id: number): Observable<Recipe> {
    return this.recipeEndpointService.getSingleByIdUsingGET(id).pipe(tap(next => {
      let foundAt = -1;
      for (let i = 0; i < this.recipes.length; i++) {
        if (this.recipes[i].id == next.id) {
          foundAt = i;
          break;
        }
      }

      if (foundAt >= 0) {
        this.recipes[foundAt] = next;
      } else {
        this.recipes.push(next);
        this.recipesRevealTimes.push(ApplicationService.getRandomInt(this.recipeRevealTimeMax));
      }
    }))
  }

  public toggleLike(doLike: boolean, recipeId: number) {
    return this.recipeEndpointService.toggleRecipeLikeUsingPUT({doLike: doLike, id: recipeId});
  }

  public getLikeStatus(recipeId: number) {
    return this.recipeEndpointService.doesAlreadyLikeRecipeUsingGET({id: recipeId});
  }

  public addComment(commentText: string, recipeId: number) {
    return this.recipeEndpointService.addCommentUsingPOST({commentContent: commentText, id: recipeId});
  }

  public deleteComment(commentId: number) {
    return this.recipeEndpointService.deleteCommentUsingDELETE({commentId: commentId});
  }

  public updateComment(commentId: number, commentText: string) {
    return this.recipeEndpointService.updateCommentUsingPUT({commentId: commentId, commentContent: commentText});
  }

  public static compareStepsQuantities(a: Step | Quantity, b: Step | Quantity): number {
    if (a.ordering < b.ordering) {
      return -1;
    }
    if (a.ordering > b.ordering) {
      return 1;
    }
    return 0;
  }
}
