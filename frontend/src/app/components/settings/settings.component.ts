import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AuthenticationService} from "../../services/authentication.service";
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {TrickyConfirmDialogComponent} from "../tricky-confirm-dialog/tricky-confirm-dialog.component";
import {UsersEndpointService} from "../../api/services/users-endpoint.service";
import {NoopScrollStrategy} from "@angular/cdk/overlay";
import {InfoEndpointService} from "../../api/services/info-endpoint.service";
import {ApplicationService, FileToUpload, UploadStatus} from "../../services/application.service";
import {ImageEditorDialogComponent} from "../image-editor-dialog/image-editor-dialog.component";
import {HttpClient, HttpEventType, HttpRequest, HttpResponse} from "@angular/common/http";
import {ApiConfiguration} from "../../api/api-configuration";
import {ConfirmDialogComponent} from "../confirm-dialog/confirm-dialog.component";
import {IngredientEndpointService} from "../../api/services/ingredient-endpoint.service";
import {Ingredient} from "../../api/models/ingredient";
import {TranslateService} from "@ngx-translate/core";
import {User} from "../../api/models/user";
import {isPlatform} from "@ionic/angular";
import {AvailableResult, Credentials, NativeBiometric} from "capacitor-native-biometric";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  public ACCEPT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif', 'image/tiff'];

  constructor(public authenticationService: AuthenticationService, private usersEndpointService: UsersEndpointService, private snackBar: MatSnackBar, private dialog: MatDialog, private infoEndpointService: InfoEndpointService, private config: ApiConfiguration, private httpClient: HttpClient, public applicationService: ApplicationService, public ingredientEndpointService: IngredientEndpointService, private translate: TranslateService, private apiConfig: ApiConfiguration) { }

  newUserNameForm = new FormGroup({
    userName: new FormControl('', Validators.maxLength(ApplicationService.SHORT_TEXT_LIMIT))
  })

  newPasswordForm = new FormGroup({
    newPassword: new FormControl('',[Validators.required, Validators.minLength(8)]),
  })

  addNewUserForm = new FormGroup({
    userName: new FormControl('',[Validators.required, Validators.maxLength(ApplicationService.SHORT_TEXT_LIMIT)]),
    password: new FormControl('',[Validators.required, Validators.minLength(8)]),
  })

  public profilePicture: FileToUpload;
  public maxFileSize: number;
  public profilePictureUploadRunning = false;
  @ViewChild('profilePreview') profilePreview: ElementRef;
  public ingredientIds: number[] = [];
  public ingredientNames = new FormArray([]);
  public ingredientSources = new FormArray([]);
  public allUsers: User[] = [];
  public biometricStored = false;

  ngOnInit(): void {
    this.infoEndpointService.getMaxSizeBytesUsingGET().subscribe(next => {
      this.maxFileSize = next;
    })
    this.checkBiometricData();
  }

  public openLinkInNewWindow(link: string) {
    window.open(link, "_blank");
  }

  public checkAndMarkDuplicateNames(nameEntered: string) {
    const nameTrimmed = nameEntered.trim();
    let controlsWithSameValue: AbstractControl[] = [];
    for (const control of this.ingredientNames.controls) {
      const controlValueTrimmed = control.value.trim();
      if (controlValueTrimmed.length > 0 && controlValueTrimmed.length <= ApplicationService.SHORT_TEXT_LIMIT) { // every control with correct length assumed valid
        control.setErrors(null);
      } else {
        control.setErrors({'lengthBad': true});
      }

      if (nameTrimmed === controlValueTrimmed) {
        controlsWithSameValue.push(control);
      }
    }

    // now set the duplicates ones to error
    if (controlsWithSameValue.length > 1) {
      for (const duplicateControl of controlsWithSameValue) {
        duplicateControl.setErrors({'duplicate': true});
      }
    }
  }

  public handleUsersPanelOpened() {
    if (this.allUsers.length < 1) {
      this.usersEndpointService.getAllUsersUsingGET().subscribe(next => {
        this.allUsers = next;
      }, error => {
        this.snackBar.open(this.translate.instant('generic.user.plural') + ' ' + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass: ["snackbar-error-theme"]});
      })
    }
  }

  public handleIngredientPanelOpened() {
    if (this.ingredientIds.length < 1) {
      this.ingredientEndpointService.getAllIngredientsUsingGET().subscribe(next => {
        for (const ingredient of next) {
          this.ingredientIds.push(ingredient.id);
          const nameControl = new FormControl(ingredient.name); // will validate length manually in checkAndMarkDuplicateNames to
          nameControl.markAsTouched(); // so that duplicate errors will be shown without having to focus everything
          nameControl.valueChanges.subscribe(next => {
            this.checkAndMarkDuplicateNames(next);
          })
          this.ingredientNames.push(nameControl);
          this.ingredientSources.push(new FormControl(ingredient.source, Validators.maxLength(ApplicationService.LONG_TEXT_LIMIT)));
        }
      }, error => {
        this.snackBar.open(this.translate.instant('generic.ingredient.plural') + ' ' + this.translate.instant('generic.couldNotLoad.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass: ["snackbar-error-theme"]})
      })
    }
  }

  public updateExistingIngredients() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
    });

    dialogRef.componentInstance.dialogTitle = this.translate.instant('settings.dialog.updateIngredients.title');
    dialogRef.componentInstance.dialogMessageFirstLine = this.translate.instant('settings.dialog.updateIngredients.body');

    dialogRef.afterClosed().subscribe(next => {
      if (next) {
        let ingredients: Ingredient[] = [];
        for (let i = 0; i < this.ingredientIds.length; i++) {
          const nameControl = this.ingredientNames.controls[i];
          const sourceControl = this.ingredientSources.controls[i];
          if (nameControl.dirty || sourceControl.dirty) {
            let newName: string;
            let newSource: string;

            // only set values of dirty input fields to help avoid collisions (multiple users change at the same time)
            if (nameControl.dirty) {
              newName = nameControl.value.trim();
            }

            if (sourceControl.dirty) {
              newSource = sourceControl.value.trim();
            }

            let ingredient: Ingredient = {id: this.ingredientIds[i], name: newName, source: newSource};
            ingredients.push(ingredient);
          }
        }
        this.ingredientEndpointService.updateIngredientsUsingPUT(ingredients).subscribe(next => {
          this.snackBar.open(`${next} ${this.translate.instant('generic.ingredient.plural')} ${this.translate.instant('generic.wasUpdated.plural')}`, this.translate.instant('generic.ok'), {duration: 5000, panelClass:["snackbar-theme"]});
        }, error => {
          this.snackBar.open(this.translate.instant('generic.ingredient.plural') + ' ' + this.translate.instant('generic.couldNotUpdate.plural'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass: ["snackbar-error-theme"]})
        })
      }});
  }

  public changeUsername(): void {
    this.usersEndpointService.updateUsernameUsingPUT({newUsername: this.newUserNameForm.value.userName}).subscribe(next => {
      this.snackBar.open(`${this.translate.instant('generic.username')} ${this.translate.instant('generic.wasUpdated.singular')}`, this.translate.instant('generic.ok'), {duration: 5000, panelClass:["snackbar-theme"]});
      this.authenticationService.authenticatedUser = next;
      this.newUserNameForm.controls['userName'].patchValue('');
    }, error => {
      if (error.status == 409) {
        this.snackBar.open(`${this.translate.instant('generic.username')} '${this.newUserNameForm.value.userName}' ${this.translate.instant('settings.snack.alreadyTaken')}`, this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
      } else {
        this.snackBar.open(`${this.translate.instant('generic.username')} ${this.translate.instant('generic.couldNotUpdate.singular')}`, this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
      }
    })
  }

  public changePassword(): void {
    this.usersEndpointService.updatePasswordUsingPUT({newPassword: this.newPasswordForm.value.newPassword}).subscribe(next => {
      this.snackBar.open(`${this.translate.instant('generic.password')} ${this.translate.instant('generic.wasUpdated.singular')}`, this.translate.instant('generic.ok'), {duration: 5000, panelClass:["snackbar-theme"]});
      this.newPasswordForm.controls['newPassword'].patchValue('');
    }, error => {
      this.snackBar.open(`${this.translate.instant('generic.password')} ${this.translate.instant('generic.couldNotUpdate.singular')}`, this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
    })
  }

  public deleteAccount(): void {
    const dialogRef = this.dialog.open(TrickyConfirmDialogComponent, {
      autoFocus: false,
      scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
    });

    dialogRef.componentInstance.dialogMessageFirstLine = this.translate.instant('settings.dialog.deleteAccount.title');
    dialogRef.componentInstance.confirmString = this.authenticationService.authenticatedUser.name;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usersEndpointService.deleteAccountUsingDELETE().subscribe(next => {
          this.authenticationService.performLogout();
        }, error => {
          this.snackBar.open(`${this.translate.instant('generic.account')} ${this.translate.instant('generic.couldNotDelete.singular')}`, this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]});
        })
      }
    });
  }

  public addNewUser(): void {
    this.usersEndpointService.registerUserUsingPOST({name: this.addNewUserForm.value.userName, password: this.addNewUserForm.value.password}).subscribe(next => {
      this.snackBar.open(`${this.translate.instant('generic.user.singular')} ${this.addNewUserForm.value.userName} ${this.translate.instant('generic.wasAdded.singular')}`, this.translate.instant('generic.ok'), {duration: 5000, panelClass:["snackbar-theme"]});
      this.addNewUserForm.controls['userName'].patchValue('');
      this.addNewUserForm.controls['password'].patchValue('');
      this.allUsers = [];
      this.handleUsersPanelOpened();
    }, error => {
      if (error.status == 409) {
        this.snackBar.open(`${this.translate.instant('generic.username')} '${this.addNewUserForm.value.userName}' ${this.translate.instant('settings.snack.alreadyTaken')}`, this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
      } else {
        this.snackBar.open(`${this.translate.instant('generic.username')} ${this.translate.instant('generic.couldNotUpdate.singular')}`, this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]})
      }
    })
  }

  public handleFileInput(files: FileList) {
    const file = files.item(0);

    this.profilePicture = {
      file: file,
      uploadProgress: 0,
      uploadStatus: UploadStatus.pending,
      isDuplicate: false,
      isTooLarge: this.maxFileSize && file.size > this.maxFileSize,
      rotation: 0
    };
    this.authenticationService.authenticatedUser.picOffsetX = 50;
    this.authenticationService.authenticatedUser.picOffsetY = 50;

    this.createImageFromBlob(file);
  }

  public openImageEditorDialog(): void {
    const dialogRef = this.dialog.open(ImageEditorDialogComponent, {
      data: {fileToUpload: this.profilePicture, maxAllowedSize: this.maxFileSize},
      width: '100vw',
      scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
    });

    dialogRef.afterClosed().subscribe(next => {
      if (next) {
        if (this.profilePicture.isTooLarge) {
          this.profilePicture.isTooLarge = false;
        }
        if (this.profilePicture.compressedData) {
          this.createImageFromBlob(this.profilePicture.compressedData);
        }
      }
    })
  }

  public uploadProfilePicture() {
    this.snackBar.open(this.translate.instant('settings.snack.profilePictureUpload'), this.translate.instant('generic.ok'), {duration: 5000, panelClass:["snackbar-theme"]});
    this.profilePictureUploadRunning = true;

    // create a new multipart-form for every file
    const formData: FormData = new FormData();
    formData.append('file', this.profilePicture.compressedData ? this.profilePicture.compressedData : this.profilePicture.file, this.profilePicture.file.name);
    formData.append('rotation', String(this.profilePicture.rotation));
    formData.append('offsetx', String(this.authenticationService.authenticatedUser.picOffsetX));
    formData.append('offsety', String(this.authenticationService.authenticatedUser.picOffsetY));

    // create a http-post request and pass the form
    // tell it to report the upload progress
    const req = new HttpRequest('POST', this.config.rootUrl + '/picture', formData, {
      reportProgress: true
    });

    this.httpClient.request(req).subscribe(event => {
      if (event.type === HttpEventType.UploadProgress) {
        // todo show this to user
        this.profilePicture.uploadProgress = Math.round(100 * event.loaded / event.total);
        //console.log(uploadFile.uploadProgress);
      } else if (event instanceof HttpResponse) {
        this.profilePictureUploadRunning = false;
        this.profilePicture = undefined;
        this.snackBar.open(`${this.translate.instant('generic.profilePicture')} ${this.translate.instant('generic.wasUploaded.singular')}`, this.translate.instant('generic.ok'), {duration: 5000, panelClass:["snackbar-theme"]});
        this.authenticationService.refreshUserInfo();
      }
    }, error => {
      this.profilePictureUploadRunning = false;
      this.profilePicture.uploadStatus = UploadStatus.failed;
      this.snackBar.open(`${this.translate.instant('generic.profilePicture')} ${this.translate.instant('generic.couldNotUpload.singular')}`, this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]});
    })
  }

  public deleteProfilePicture() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
    });

    dialogRef.componentInstance.dialogTitle = this.translate.instant('settings.dialog.deleteProfilePicture.title');
    dialogRef.componentInstance.dialogMessageFirstLine = this.translate.instant('settings.dialog.deleteProfilePicture.body');

    dialogRef.afterClosed().subscribe(next => {
      if (next) {
        this.usersEndpointService.deleteProfilePictureUsingDELETE().subscribe(next => {
          this.authenticationService.refreshUserInfo();
          this.snackBar.open(`${this.translate.instant('generic.profilePicture')} ${this.translate.instant('generic.wasDeleted.singular')}`, this.translate.instant('generic.ok'), {duration: 5000, panelClass:["snackbar-theme"]});
        }, error => {
          this.snackBar.open(`${this.translate.instant('generic.profilePicture')} ${this.translate.instant('generic.couldNotDelete.singular')}`, this.translate.instant('generic.notOk'), {duration: 10000, panelClass:["snackbar-error-theme"]});
        })
      }
    })
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.profilePreview.nativeElement.src = reader.result;
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }

  private checkBiometricData() {
    if (isPlatform('mobile')) {
      NativeBiometric.isAvailable().then((result: AvailableResult) => {
        if (result.isAvailable) {
          // Get user's credentials
          NativeBiometric.getCredentials({
            server: this.apiConfig.rootUrl,
          }).then((credentials: Credentials) => {
            this.biometricStored = true;
          }, (error) => {
            console.log('Hiding delete biometric button: ' + error.message);
            this.biometricStored = false;
          });
        }
      });
    }
  }

  public deleteBiometric() {
    if (isPlatform('mobile')) {
      NativeBiometric.isAvailable().then((result: AvailableResult) => {
        if (result.isAvailable) {
          // Get user's credentials
          NativeBiometric.getCredentials({
            server: this.apiConfig.rootUrl,
          }).then((credentials: Credentials) => {
            // Authenticate using biometrics before logging the user in
            NativeBiometric.verifyIdentity({
              title: this.translate.instant('settings.myAccount.biometric.deleteButton'),
              subtitle: this.translate.instant('settings.myAccount.biometric.promptSubTitle')
            }).then(() => {
                // Authentication successful
                NativeBiometric.deleteCredentials({
                  server: this.apiConfig.rootUrl,
                }).then(() => {
                  this.snackBar.open(this.translate.instant('settings.myAccount.biometric.snack.deleteSuccess'), this.translate.instant('generic.ok'), {duration: 5000, panelClass: ["snackbar-theme"]});
                  this.biometricStored = false;
                }, (error) => {
                  console.log('Something went wrong while deleting biometric data: ' + error.message);
                  this.snackBar.open(this.translate.instant('settings.myAccount.biometric.snack.deleteFail'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass: ["snackbar-error-theme"]});
                });
              }, (error) => {
                this.snackBar.open(this.translate.instant('login.biometric.verifyError'), this.translate.instant('generic.notOk'), {duration: 10000, panelClass: ["snackbar-error-theme"]});
                console.log('Something went wrong while verifying biometric identity for credential removal: ' + error.message);
              }
            );
          }, (error) => {
            console.log('Something went wrong while getting biometric credentials for credential removal: ' + error.message);
            this.biometricStored = false;
          });
        }
      });
    }
  }
}
