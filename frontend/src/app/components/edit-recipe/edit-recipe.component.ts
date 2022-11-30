import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {MatSnackBar} from "@angular/material/snack-bar";
import {RecipesService} from "../../services/recipes.service";
import {Recipe} from "../../api/models/recipe";
import {Quantity} from "../../api/models/quantity";
import {Unit} from "../../api/models/unit";
import {UnitEndpointService} from "../../api/services/unit-endpoint.service";
import {BehaviorSubject} from "rxjs";
import {Ingredient} from "../../api/models/ingredient";
import {IngredientEndpointService} from "../../api/services/ingredient-endpoint.service";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {MatAutocomplete, MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {LabelsEndpointService} from "../../api/services/labels-endpoint.service";
import {Label} from "../../api/models/label";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {InfoEndpointService} from "../../api/services/info-endpoint.service";
import {HttpClient, HttpEventType, HttpRequest, HttpResponse} from "@angular/common/http";
import {ApiConfiguration} from "../../api/api-configuration";
import {NoopScrollStrategy} from "@angular/cdk/overlay";
import {AuthenticationService} from "../../services/authentication.service";
import {ImageEditorDialogComponent} from "../image-editor-dialog/image-editor-dialog.component";
import {CanComponentDeactivate} from "../../services/can-deactivate";
import {TrickyConfirmDialogComponent} from "../tricky-confirm-dialog/tricky-confirm-dialog.component";
import {Step} from "../../api/models/step";
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {ThemePalette} from "@angular/material/core";
import {ApplicationService, FileToUpload, UploadStatus} from "../../services/application.service";
import {ConfirmDialogComponent} from "../confirm-dialog/confirm-dialog.component";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-edit-recipe',
  templateUrl: './edit-recipe.component.html',
  styleUrls: ['./edit-recipe.component.scss']
})
export class EditRecipeComponent implements OnInit, CanComponentDeactivate {

  public ACCEPT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif', 'image/tiff'];

  public form: FormGroup = new FormGroup({
    recipeName: new FormControl('',[Validators.required, Validators.maxLength(ApplicationService.SHORT_TEXT_LIMIT)]),
    servings: new FormControl(2, [Validators.required, Validators.max(32767)]),
    description: new FormControl('', Validators.maxLength(ApplicationService.LONG_TEXT_LIMIT)),
    labels: new FormControl(),
  });
  public amounts = new FormArray([]);
  public units = new FormArray([]);
  public ingredients = new FormArray([]);
  public optionals = new FormArray([]);
  private quantityIds: number[] = [];
  public steps = new FormArray([]);

  // ingredients + units + amounts
  public unitOptions:Unit[] = [];
  public ingredientOptions:Ingredient[] = [];

  // labels
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredLabels: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  labels: Label[] = [];
  labelOptions: Label[] = [];
  @ViewChild('labelsInput') labelInput: ElementRef<HTMLInputElement>;
  @ViewChild('labelsAuto') labelAutocomplete: MatAutocomplete;
  public editingExistingRecipe: Recipe = null;

  // picture upload
  public maxFileSize: number;
  public amountDuplicateFiles = 0;
  public amountFilesTooLarge = 0;
  public uploadFiles: Set<FileToUpload> = new Set();
  public picturesAlreadyUploaded: any[] = [];
  public picturesAlreadyUploadedDelete: boolean[] = [];
  private picturesAlreadyUploadedGlobalIds: number[] = [];

  public saveDeleteInProgress;
  private saveCompleted = false;
  public UploadStatus = UploadStatus; // for html access

  constructor(private snackbar:MatSnackBar, private recipeService:RecipesService, private unitEndpointService:UnitEndpointService, private ingredientEndpointService: IngredientEndpointService, private labelsEndpointService: LabelsEndpointService, private route: ActivatedRoute, private router: Router, private dialog: MatDialog, private infoEndpointService: InfoEndpointService, private config: ApiConfiguration, private httpClient: HttpClient, public authenticationService: AuthenticationService, private applicationService: ApplicationService, private translate: TranslateService) { }

  ngOnInit(): void {
    this.unitEndpointService.getAllUnitsUsingGET().subscribe(next => {
      this.unitOptions = next;
    }, error => {
      this.snackbar.open(this.translate.instant('generic.unit.plural') + ' ' + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]});
    });

    this.ingredientEndpointService.getAllIngredientsUsingGET().subscribe(next => {
      this.ingredientOptions = next;
    }, error => {
      this.snackbar.open(this.translate.instant('generic.ingredient.plural') + ' ' + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]});
    });

    this.route.params.subscribe(params => {
      const editRecipeId = params.id;

      this.labelsEndpointService.getAllLabelsUsingGET().subscribe(next => {
        this.labelOptions = next;
        if (!editRecipeId) {
          this.addExampleLabel();
        }
      }, error => {
        this.snackbar.open(this.translate.instant('generic.label.plural') + ' ' + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]});
      });

      if (editRecipeId != null) {
        this.loadOrRedirect(editRecipeId);
      } else {
        this.addIngredient(false);
        this.addStep();
      }
    });

    this.infoEndpointService.getMaxSizeBytesUsingGET().subscribe(next => {
      this.maxFileSize = next;
    })
  }

  private loadOrRedirect(editRecipeId) {
    this.recipeService.getRecipeById(editRecipeId).subscribe(next => {
      if (next == null) { // went to non-existing recipe -> go back to landing
        this.router.navigate(['/overview']);
        return;
      }

      this.patchExistingRecipeValues(next);

      for (const pic of next.pics) {
        this.applicationService.getImage(pic.id).subscribe(next => {
          this.createImageFromBlob(next, pic.id);
        }, error => {
          console.log(error);
        });
      }
    }, error => {
      // went to non-existing recipe -> go back to landing
      this.router.navigate(['/overview']);
      return;
    })
  }

  private patchExistingRecipeValues(recipe: Recipe): void {
    this.editingExistingRecipe = recipe;
    this.form.controls['recipeName'].patchValue(recipe.name);
    this.form.controls['servings'].patchValue(recipe.servings);
    this.form.controls['description'].patchValue(recipe.description);
    this.form.controls['labels'].patchValue('');
    this.labels = [];
    for (const label of recipe.labels) {
      this.labels.push(label);
    }

    recipe.quantities.sort(RecipesService.compareStepsQuantities);
    for (let i = 0; i < recipe.quantities.length; i++) {
      const quantity = recipe.quantities[i];
      const personalPreference = !quantity.amount && !quantity.unit;
      this.addIngredient(personalPreference);
      if (!personalPreference) {
        this.amounts.controls[i].patchValue(quantity.amount);
        this.units.controls[i].patchValue(quantity.unit.name);
      }

      this.ingredients.controls[i].patchValue(quantity.ingredient.name);
      this.optionals.controls[i].patchValue(quantity.optional);
      this.quantityIds[i] = quantity.id;
    }

    recipe.steps.sort(RecipesService.compareStepsQuantities);
    for (let i = 0; i < recipe.steps.length; i++) {
      this.addStep();
      this.steps.controls[i].patchValue(recipe.steps[i].description);
    }
  }

  private addExampleLabel(): void {
    if (this.labelOptions.length > 0) {
      this.labels.push(this.labelOptions[ApplicationService.getRandomInt(this.labelOptions.length)]);
    }
  }

  add(): void {
    // Add our label
    const inputTrimmed = (this.form.value.labels || '').trim();
    if (inputTrimmed && inputTrimmed.length <= ApplicationService.SHORT_TEXT_LIMIT) {
      let trimmedInput = this.form.value.labels.trim();
      if (!this.labelAlreadyAdded(trimmedInput)) {
        this.labels.push({name: trimmedInput});
      }
    }

    this.resetLabelsInput();
    this.filterLabels();
  }

  private labelAlreadyAdded(labelName: string): boolean{
    for (const label of this.labels) {
      if (label.name === labelName) {
        return true;
      }
    }
    return false;
  }

  remove(label: Label): void {
    const index = this.labels.indexOf(label);

    if (index >= 0) {
      this.labels.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const labelName = event.option.value as string;
    if (!this.labelAlreadyAdded(labelName)) {
      this.labels.push({name: labelName});
    }
    this.resetLabelsInput();
    this.labelInput.nativeElement.blur();
    this.filterLabels();
    setTimeout(() => {this.labelInput.nativeElement.focus()}, 1);
  }

  private resetLabelsInput(): void {
    this.labelInput.nativeElement.value = '';
    this.form.controls['labels'].setValue(null);
  }

  public filterLabels() {
    const filteredLabelOptions = this.filterByName(this.form.value.labels || '', this.labelOptions);
    this.filteredLabels.next(filteredLabelOptions);
  }

  public addStep(): void {
    this.steps.push(new FormControl('', [Validators.required, Validators.maxLength(ApplicationService.LONG_TEXT_LIMIT)]));
  }

  public removeStep(index: number): void {
    if (this.steps.controls[index].value.length < 1) {
      this.steps.removeAt(index);
    } else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
      });

      dialogRef.componentInstance.dialogTitle = this.translate.instant('edit.dialogs.stepDelete.title');
      dialogRef.componentInstance.dialogMessageFirstLine = this.translate.instant('edit.dialogs.stepDelete.body');

      dialogRef.afterClosed().subscribe(next => {
        if (next) {
          this.steps.removeAt(index);
        }
      })
    }
  }

  public addIngredient(personalPreference: boolean): void {
    if (personalPreference) {
      this.amounts.push(new FormControl(''));
      this.units.push(new FormControl(''));
    } else {
      this.amounts.push(new FormControl('', Validators.required));
      this.units.push(new FormControl('', [Validators.required, Validators.maxLength(ApplicationService.SHORT_TEXT_LIMIT)]));
    }
    this.ingredients.push(new FormControl('', [Validators.required, Validators.maxLength(ApplicationService.SHORT_TEXT_LIMIT)]));
    this.optionals.push(new FormControl(false));
    this.quantityIds.push(null);
  }

  public removeIngredient(index: number): void{
    this.amounts.removeAt(index);
    this.units.removeAt(index);
    this.ingredients.removeAt(index);
    this.optionals.removeAt(index);
    this.quantityIds.splice(index, 1);
  }

  public deleteRecipe(): void {
    const dialogRef = this.dialog.open(TrickyConfirmDialogComponent, {
      autoFocus: false,
      scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
    });

    dialogRef.componentInstance.dialogTitle = this.translate.instant('edit.dialogs.recipeDelete.title');
    dialogRef.componentInstance.dialogMessageFirstLine = this.translate.instant('generic.noUndo');
    dialogRef.componentInstance.confirmString = this.form.value.recipeName;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveDeleteInProgress = true;
        if (this.editingExistingRecipe !== null) {
          this.recipeService.deleteRecipe(this.editingExistingRecipe.id).subscribe(next => {
            this.snackbar.open(this.translate.instant('generic.recipe.singular') + ' ' + this.translate.instant('generic.wasDeleted.singular'), this.translate.instant('generic.ok'), {duration: 5000, panelClass:["snackbar-theme"]});
            this.refreshAndRedirectRecipe(null);
          }, error => {
            this.snackbar.open(this.translate.instant('generic.recipe.singular') + ' ' + this.translate.instant('generic.couldNotDelete.singular'), this.translate.instant('generic.notOk'), {duration: 5000, panelClass:["snackbar-error-theme"]});
            this.saveDeleteInProgress = false;
          })
        }
      }
    });
  }

  public saveRecipe(): void{
    let recipe = this.buildRecipe();
    this.saveDeleteInProgress = true;

    if (this.editingExistingRecipe !== null) {
      this.recipeService.updateRecipe(recipe).subscribe(next => {
        this.snackbar.open(this.translate.instant('generic.recipe.singular') + ' ' + this.translate.instant("generic.wasUpdated.singular") + "! 😋", this.translate.instant("generic.ok"), {duration: 5000, panelClass:["snackbar-theme"]});
        let deleteThosePictureIds = [];
        for (let i = 0; i < this.picturesAlreadyUploadedDelete.length; i++) {
          if (this.picturesAlreadyUploadedDelete[i]) {
            deleteThosePictureIds.push(this.picturesAlreadyUploadedGlobalIds[i]);
          }
        }

        if (deleteThosePictureIds.length > 0) {
          this.recipeService.deleteImages(this.editingExistingRecipe.id, deleteThosePictureIds).subscribe(deletedPics => {
            this.startUpload(next);
            //console.log(next);
          }, error => {
            this.snackbar.open(this.translate.instant('generic.picture.plural') + ' ' + this.translate.instant("generic.couldNotDelete.plural"), this.translate.instant("generic.notOk"), {duration: 5000, panelClass:["snackbar-error-theme"]});
          })
        } else {
          this.startUpload(next);
        }
      }, error => {
        if (error.status === 409) {
          this.snackbar.open(`${this.translate.instant('edit.snack.duplicateRecipe.prefix')} '${recipe.name}' ${this.translate.instant('edit.snack.duplicateRecipe.suffix')}`, this.translate.instant("generic.notOk"), {duration: 5000, panelClass:["snackbar-error-theme"]});
        } else {
          this.snackbar.open(this.translate.instant('generic.recipe.singular') + ' ' + this.translate.instant("generic.couldNotUpdate.singular"), this.translate.instant("generic.notOk"), {duration: 5000, panelClass:["snackbar-error-theme"]});
        }
        this.saveDeleteInProgress = false;
      })
    } else {
      this.recipeService.addRecipe(recipe).subscribe(next =>{
        this.snackbar.open(this.translate.instant('generic.recipe.singular') + ' ' + this.translate.instant("generic.wasSaved.singular") + "! 😋", this.translate.instant("generic.ok"), {duration: 5000, panelClass:["snackbar-theme"]});
        this.startUpload(next);
      }, error => {
        if (error.status === 409) {
          this.snackbar.open(`${this.translate.instant('edit.snack.duplicateRecipe.prefix')} '${recipe.name}' ${this.translate.instant('edit.snack.duplicateRecipe.suffix')}`, this.translate.instant("generic.notOk"), {duration: 5000, panelClass:["snackbar-error-theme"]});
        } else {
          this.snackbar.open(this.translate.instant('generic.recipe.singular') + ' ' + this.translate.instant("generic.couldNotSave.singular"), this.translate.instant("generic.notOk"), {duration: 5000, panelClass:["snackbar-error-theme"]});
        }
        this.saveDeleteInProgress = false;
      })
    }
  }

  private startUpload(recipeId: number) {
    if (this.uploadFiles.size < 1) {
      // todo why is deletion of pictures not updating through this?
      this.refreshAndRedirectRecipe(recipeId);
      return;
    }

    this.snackbar.open(this.translate.instant('edit.snack.pictureUpload'), this.translate.instant("generic.ok"), {duration: 5000, panelClass:["snackbar-theme"]});

    for (let uploadFile of this.uploadFiles) {
      // create a new multipart-form for every file
      const formData: FormData = new FormData();
      formData.append('file', uploadFile.compressedData ? uploadFile.compressedData : uploadFile.file, uploadFile.file.name);
      formData.append('rotation', String(uploadFile.rotation));

      // create a http-post request and pass the form
      // tell it to report the upload progress
      const req = new HttpRequest('POST', this.config.rootUrl + '/recipes/' + recipeId + '/upload', formData, {
        reportProgress: true
      });

      this.httpClient.request(req).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          uploadFile.uploadProgress = Math.round(100 * event.loaded / event.total);
          //console.log(uploadFile.uploadProgress);
        } else if (event instanceof HttpResponse) {
          uploadFile.uploadStatus = UploadStatus.success;
          this.handleUploadFinished(recipeId);
        }
      }, error => {
        uploadFile.uploadStatus = UploadStatus.failed;
        this.handleUploadFinished(recipeId);
      })
    }
  }

  private handleUploadFinished(recipeId) {
    let oneOrMoreFilesFailed = false;

    for (const uploadFile of this.uploadFiles) {
      if (uploadFile.uploadStatus == UploadStatus.pending) {
        return; // perform no action when there are still pending files
      }

      if (uploadFile.uploadStatus == UploadStatus.failed) {
        oneOrMoreFilesFailed = true;
      }
    }

    if (!oneOrMoreFilesFailed) {
      this.snackbar.open(this.translate.instant('generic.picture.plural') + ' ' + this.translate.instant("generic.wasUploaded.plural"), this.translate.instant("generic.ok"), {duration: 5000, panelClass:["snackbar-theme"]});
      this.refreshAndRedirectRecipe(recipeId);
    } else if (oneOrMoreFilesFailed) {
      this.snackbar.open(this.translate.instant('generic.picture.plural') + ' ' + this.translate.instant("generic.couldNotUpload.plural"), this.translate.instant("generic.notOk"), {duration: 5000, panelClass:["snackbar-error-theme"]});
      this.saveDeleteInProgress = false;
    }
  }

  private refreshAndRedirectRecipe(recipeId: number) {
    if (recipeId === null) { // recipe deleted
      this.completeSaveDelete();
      this.recipeService.resetService();
      this.router.navigate(['/overview']);
      return;
    }

    this.recipeService.refreshRecipeById(recipeId).subscribe(next => {
      this.completeSaveDelete();
      this.router.navigate(['/recipe', recipeId]);
    }, error => {
      this.completeSaveDelete();
      this.snackbar.open(this.translate.instant('generic.recipe.singular') + ' ' + this.translate.instant("generic.couldNotLoad.singular"), this.translate.instant("generic.notOk"), {
        duration: 5000,
        panelClass: ["snackbar-error-theme"]
      });
    });
  }

  private completeSaveDelete(): void {
    this.saveCompleted = true;
    this.saveDeleteInProgress = false;
  }

  private buildRecipe():Recipe {
    let quantities: Quantity[] = [];

    for (let i = 0; i < this.ingredients.length; i++) {
      let quantity: Quantity = {
        id: this.quantityIds[i],
        amount: this.amounts.controls[i].value,
        unit: {name: this.units.controls[i].value.trim()},
        ingredient: {name: this.ingredients.controls[i].value.trim()},
        optional: this.optionals.controls[i].value
      };
      quantities.push(quantity);
    }

    let steps: Step[] = [];
    for (let i = 0; i < this.steps.length; i++) {
      let step: Step = {
        description: this.steps.controls[i].value.trim()
      }
      steps.push(step);
    }

    let existingRecipeId = null;
    if (this.editingExistingRecipe !== null) {
      existingRecipeId = this.editingExistingRecipe.id;
    }

    return {
      id: existingRecipeId,
      name: this.form.value.recipeName.trim(),
      description: this.form.value.description.trim(),
      servings: this.form.value.servings,
      quantities: quantities,
      labels: this.labels,
      steps: steps
    }
  }

  private filterByName(value: string, filterThose) {
    const filterValue = value.toLowerCase();
    return filterThose.filter(option => option.name.toLowerCase().includes(filterValue)).map(option => option.name);
  }

  public addAttachment(event) {
    for (let index = 0; index < event.length; index++) {
      const element = event[index];

      let fileAlreadyExists = this.doesAlreadyExist(element);
      let fileTooLarge = this.maxFileSize && element.size > this.maxFileSize;

      if (fileAlreadyExists) {
        this.amountDuplicateFiles++;
      }

      if (fileTooLarge) {
        this.amountFilesTooLarge++;
      }

      this.uploadFiles.add({
        file: element,
        uploadProgress: 0,
        uploadStatus: UploadStatus.pending,
        isDuplicate: fileAlreadyExists,
        isTooLarge: fileTooLarge,
        rotation: 0
      });
    }
  }

  private doesAlreadyExist(element): boolean {
    for (const alreadyAdded of this.uploadFiles) {
      if (alreadyAdded.file.name === element.name) {
        return true;
      }
    }

    return false;
  }

  public bytesToHumanReadable(bytes: number): string {
    let i = Math.floor(Math.log(bytes) / Math.log(1024)),
      sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    return (bytes / Math.pow(1024, i)).toFixed(0) + ' ' + sizes[i];
  }

  public deleteAttachment(uploadFile: FileToUpload) {
    if (uploadFile.isDuplicate) {
      this.amountDuplicateFiles--;
    }

    if (uploadFile.isTooLarge) {
      this.amountFilesTooLarge--;
    }

    this.uploadFiles.delete(uploadFile);
  }

  createImageFromBlob(image: Blob, imageGlobalId: number) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.picturesAlreadyUploaded.push(reader.result);
      this.picturesAlreadyUploadedDelete.push(false);
      this.picturesAlreadyUploadedGlobalIds.push(imageGlobalId);
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  public togglePictureForDeletion(index) {
    this.picturesAlreadyUploadedDelete[index] = !this.picturesAlreadyUploadedDelete[index];
  }

  public anyPictureMarkedForDeletion(): boolean {
    for (const markedDelete of this.picturesAlreadyUploadedDelete) {
      if (markedDelete) {
        return true;
      }
    }
    return false;
  }

  public allowedToDelete(): boolean {
    return this.editingExistingRecipe !== null && (this.editingExistingRecipe.createdBy === null || this.editingExistingRecipe.createdBy.id === this.authenticationService.authenticatedUser.id);
  }

  public allowToSave(): boolean {
    return !this.saveDeleteInProgress && this.form.valid && this.amounts.valid && this.units.valid && this.ingredients.valid && this.steps.valid && this.amountDuplicateFiles < 1 && this.amountFilesTooLarge < 1;
  }

  public openImageEditorDialog(file: FileToUpload): void {
    const dialogRef = this.dialog.open(ImageEditorDialogComponent, {
      data: {fileToUpload: file, maxAllowedSize: this.maxFileSize},
      width: '100vw',
      scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
    });

    dialogRef.afterClosed().subscribe(next => {
      if (next) {
        if (file.isTooLarge) {
          file.isTooLarge = false;
          this.amountFilesTooLarge--;
        }
      }
    })
  }

  requireConfirm(): boolean {
    if (this.saveCompleted) {
      return false;
    }
    return this.form.dirty || this.amounts.dirty || this.ingredients.dirty || this.units.dirty || this.optionals.dirty || this.steps.dirty || this.uploadFiles.size > 0 || this.anyPictureMarkedForDeletion();
  }

  public reorderQuantity(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.amounts.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.units.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.ingredients.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.optionals.controls, event.previousIndex, event.currentIndex);
  }

  public reorderStep(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.steps.controls, event.previousIndex, event.currentIndex);
  }

  public cancelEdit(): void {
    if (this.editingExistingRecipe === null) {
      this.router.navigate(['/overview']);
    } else {
      this.router.navigate(['/recipe', this.editingExistingRecipe.id]);
    }
  }

  public statusToColor(status: UploadStatus): ThemePalette {
    if (status == UploadStatus.success) {
      return 'primary';
    }

    if (status == UploadStatus.pending) {
      return 'accent';
    }

    if (status == UploadStatus.failed) {
      return 'warn';
    }
  }
}
