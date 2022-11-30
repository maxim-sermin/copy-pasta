import {AfterContentInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {RecipesService} from "../../services/recipes.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {IngredientEndpointService} from "../../api/services/ingredient-endpoint.service";
import {LabelsEndpointService} from "../../api/services/labels-endpoint.service";
import {FormControl, FormGroup} from "@angular/forms";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {ApplicationService} from "../../services/application.service";
import {TranslateService} from "@ngx-translate/core";
import {sampleTime} from "rxjs/operators";
import {Subject} from "rxjs";

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterContentInit {

  public ComponentSearchSuggestionType = SearchSuggestionType;

  public recipeNameSuggestions: SearchSuggestion[] = [];
  public advancedSearchTerms: SearchSuggestion[] = [];
  public filteredSearchTerms: SearchSuggestion[] = [];
  public filteredRecipeNames: SearchSuggestion[] = []
  public addedSearchTerms: SearchSuggestion[] = [];
  public labelSuggestionsLoading = true;
  public ingredientSuggestionsLoading = true;
  public recipeNameSuggestionsLoading = true;
  public labelSuggestionsLoadingStarted;
  public ingredientSuggestionsLoadingStarted;
  public recipeNameSuggestionsLoadingStarted;
  public sortOptions = ['date', 'likes'];
  public sortingDescending = true;
  private windowResized = new Subject<void>();

  public form: FormGroup = new FormGroup({
    recipeName: new FormControl(''),
    searchTerm: new FormControl(''),
    advancedSearch: new FormControl(),
    sortBy: new FormControl(this.sortOptions[0])
  });

  constructor(public recipesService: RecipesService, private snackbar: MatSnackBar, private ingredientEndpointService: IngredientEndpointService, private labelsEndpointService: LabelsEndpointService, private applicationService: ApplicationService, private translate: TranslateService) { }

  @ViewChild('loadMoreButton', {read: ElementRef}) public loadMoreButton: ElementRef;
  @ViewChild('recipeNameSearchInput') recipeNameSearchInput: ElementRef<HTMLInputElement>;
  @ViewChild('advancedSearchInput') advancedSearchInput: ElementRef<HTMLInputElement>;

  @HostListener('window:scroll', ['$event']) // for window scroll events
  onScroll(event) {
    this.loadMoreIfButtonVisible();
  }

  @HostListener('window:resize', ['$event'])
  onResize(target) {
    this.windowResized.next();
  }

  ngOnInit(): void {
    this.getAdvancedSearchFromLocal();
  }

  public setSortBy(selectedOption: string) {
    localStorage.setItem('sortBy', selectedOption);
  }

  public toggleSortDirection() {
    this.sortingDescending = !this.sortingDescending;
    localStorage.setItem('sortDescending', String(this.sortingDescending));
  }

  public setAdvancedSearch(isEnabled: boolean): void {
    localStorage.setItem('advancedSearch', String(isEnabled));
    if (!isEnabled) {
      this.addedSearchTerms = [];
      this.resetSearchInput();
    }
  }

  private getAdvancedSearchFromLocal(): void {
    const advancedSearchFromLocal = localStorage.getItem('advancedSearch');
    if (advancedSearchFromLocal !== null) {
      this.form.controls['advancedSearch'].setValue(JSON.parse(advancedSearchFromLocal));
    }

    const sortByFromLocal = localStorage.getItem('sortBy');
    if (sortByFromLocal !== null) {
      this.form.controls['sortBy'].setValue(sortByFromLocal);
    }

    const sortDescendingFromLocal = localStorage.getItem('sortDescending');
    if (sortDescendingFromLocal !== null) {
      this.sortingDescending = JSON.parse(sortDescendingFromLocal);
    }
  }

  // changing this from 'ngAfterViewInit' magically avoids 'ExpressionChangedAfterItHasBeenCheckedError'
  ngAfterContentInit(): void {
    //console.log("Request more recipes because overview was just initialized");
    this.form.controls['recipeName'].patchValue(this.applicationService.landingRecipeNameSearch);
    if (this.applicationService.landingAdvancedSearchLabelsJSON) {
      this.addedSearchTerms = JSON.parse(this.applicationService.landingAdvancedSearchLabelsJSON);
    } else {
      this.addedSearchTerms = [];
    }
    this.searchRecipes();

    this.windowResized.pipe(sampleTime(800)).subscribe(() => {
      this.loadMoreIfButtonVisible();
    });
  }

  public searchRecipes(): void {
    this.applicationService.landingRecipeNameSearch = this.form.value.recipeName;
    if (this.addedSearchTerms.length > 0) {
      this.applicationService.landingAdvancedSearchLabelsJSON = JSON.stringify(this.addedSearchTerms);
    } else {
      this.applicationService.landingAdvancedSearchLabelsJSON = undefined;
    }
    this.recipesService.resetService();
    this.fetchMoreRecipes();
  }

  public fetchMoreRecipes(): void {
    if (!this.recipesService.reachedEnd && !this.recipesService.refreshRunning) {
      let labelNameSearchTerms: string[] = [];
      let ingredientNameSearchTerms: string[] = [];

      for (const addedSearchTerm of this.addedSearchTerms) {
        if (addedSearchTerm.type === SearchSuggestionType.Label) {
          labelNameSearchTerms.push(addedSearchTerm.name);
        } else if (addedSearchTerm.type === SearchSuggestionType.Ingredient) {
          ingredientNameSearchTerms.push(addedSearchTerm.name);
        }
      }

      this.recipesService.refreshRecipes(this.form.value.recipeName, labelNameSearchTerms, ingredientNameSearchTerms, this.form.value.sortBy !== this.sortOptions[0], !this.sortingDescending).subscribe(next => {
        setTimeout(() => {
            this.loadMoreIfButtonVisible();
          }, 1);
      }, error => {
        this.snackbar.open(this.translate.instant('generic.recipe.plural') + ' ' + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 5000, panelClass:["snackbar-error-theme"]});
      });
    }
  }

  public focusRecipeName() {
    if (!this.recipeNameSuggestionsLoadingStarted) {
      this.recipeNameSuggestionsLoadingStarted = true;
      this.recipesService.getRecipeNames().subscribe(next => {
        this.recipeNameSuggestionsLoading = false;
        for (const recipeName of next) {
          this.recipeNameSuggestions.push({name: recipeName, type: SearchSuggestionType.Other});
        }
        this.filterRecipeName();
      }, error => {
        this.recipeNameSuggestionsLoading = false;
        this.snackbar.open(this.translate.instant('overview.snack.recipeSuggestions') + ' ' + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
      });
    }
  }

  public filterRecipeName() {
    this.filteredRecipeNames = this.filterStrings(this.form.value.recipeName || '', this.recipeNameSuggestions);
  }

  public focusAdvanced() {
    if (!this.labelSuggestionsLoadingStarted) {
      this.labelSuggestionsLoadingStarted = true;
      this.labelsEndpointService.getAllLabelNamesUsingGET().subscribe(next => {
        this.labelSuggestionsLoading = false;
        for (const labelName of next) {
          this.advancedSearchTerms.push({name: labelName, type: SearchSuggestionType.Label});
        }
        this.filterAdvanced();
      }, error => {
        this.labelSuggestionsLoading = false;
        this.snackbar.open(this.translate.instant('overview.snack.labelSuggestions') + ' ' + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
      });
    }

    if (!this.ingredientSuggestionsLoadingStarted) {
      this.ingredientSuggestionsLoadingStarted = true;
      this.ingredientEndpointService.getAllIngredientNamesUsingGET().subscribe(next => {
        this.ingredientSuggestionsLoading = false;
        for (const ingredientName of next) {
          this.advancedSearchTerms.push({name: ingredientName, type: SearchSuggestionType.Ingredient});
        }
        this.filterAdvanced();
      }, error => {
        this.ingredientSuggestionsLoading = false;
        this.snackbar.open(this.translate.instant('overview.snack.ingredientSuggestions') + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
      });
    }
  }

  public filterAdvanced() {
    this.filteredSearchTerms = this.filterStrings(this.form.value.searchTerm || '', this.advancedSearchTerms);
  }

  private filterStrings(value: string, filterThose: SearchSuggestion[]): SearchSuggestion[] {
    const filterValue = value.toLowerCase();
    return filterThose.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  public selectedRecipeNameSuggestion(event: MatAutocompleteSelectedEvent): void {
    const selected = event.option.value as string;
    this.setSearchInputTo(selected);
  }

  public selectedAdvancedSuggestion(event: MatAutocompleteSelectedEvent): void {
    const selected = event.option.value as string;
    if (!this.isSearchTermAlreadyAdded(selected)) {
      this.addedSearchTerms.push(this.getAdvancedSuggestionByName(selected));
    }
    this.resetSearchInput();
    this.advancedSearchInput.nativeElement.blur();
    this.filterAdvanced();
    setTimeout(() => {this.advancedSearchInput.nativeElement.focus()}, 1);
  }

  // form and autocomplete can only work with strings -> fetch corresponding type so we can show correct chip
  private getAdvancedSuggestionByName(name: string): SearchSuggestion {
    for (const filteredSearchTerm of this.filteredSearchTerms) {
      if (filteredSearchTerm.name === name) {
        return filteredSearchTerm;
      }
    }
  }

  public remove(searchTerm: SearchSuggestion): void {
    const index = this.addedSearchTerms.indexOf(searchTerm);

    if (index >= 0) {
      this.addedSearchTerms.splice(index, 1);
    }
  }

  public getTooltipFromType(searchTerm: SearchSuggestion): string {
    if (searchTerm.type == SearchSuggestionType.Ingredient) {
      return this.translate.instant('generic.ingredient.singular');
    }

    if (searchTerm.type == SearchSuggestionType.Label) {
      return this.translate.instant('generic.label.singular');
    }
  }

  private setSearchInputTo(value: string): void {
    this.recipeNameSearchInput.nativeElement.value = value;
    this.form.controls['recipeName'].setValue(value);
  }

  private resetSearchInput(): void {
    this.advancedSearchInput.nativeElement.value = '';
    this.form.controls['searchTerm'].setValue(null);
  }

  private isSearchTermAlreadyAdded(name: string): boolean {
    for (const addedSearchTerm of this.addedSearchTerms) {
      if (addedSearchTerm.name === name) {
        return true;
      }
    }
    return false;
  }

  private loadMoreIfButtonVisible() {
    if (ApplicationService.isInViewport(this.loadMoreButton.nativeElement)) {
      this.fetchMoreRecipes();
    }
  }
}

interface SearchSuggestion {
  name: string,
  type: SearchSuggestionType
}

enum SearchSuggestionType {
  Label, Ingredient, Other
}

