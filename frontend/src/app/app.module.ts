import { BrowserModule } from '@angular/platform-browser';
import {forwardRef, NgModule} from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatToolbarModule} from "@angular/material/toolbar";
import { LandingComponent } from './components/landing/landing.component';
import {AppRoutingModule} from "./app-routing.module";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from "@angular/common/http";
import {MatChipsModule} from "@angular/material/chips";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import { EditRecipeComponent } from './components/edit-recipe/edit-recipe.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatSelectModule} from "@angular/material/select";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import { RecipePageComponent } from './components/recipe-page/recipe-page.component';
import {MatListModule} from "@angular/material/list";
import {MatRippleModule} from "@angular/material/core";
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import {MatDialogModule} from "@angular/material/dialog";
import {DragDropDirective} from "./components/edit-recipe/drag-drop-directive";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import { RecipePreviewComponent } from './components/landing/recipe-preview/recipe-preview.component';
import {CarouselComponent, CarouselItemElement} from "./components/recipe-page/carousel/carousel.component";
import {CarouselItemDirective} from "./components/recipe-page/carousel/carousel-item.directive";
import {MatProgressSpinner, MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import { IngredientRowComponent } from './components/edit-recipe/ingredient-row/ingredient-row.component';
import { LoginComponent } from './components/login/login.component';
import {LoginDialogComponent} from "./components/login/dialog/login-dialog.component";
import {LoginRouteGuard} from "./services/login-route-guard";
import {AuthInterceptor} from "./services/auth-interceptor.service";
import {NotFoundComponent} from "./components/not-found/not-found.component";
import {DateAgoPipe} from "./pipes/date-ago.pipe";
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions, MatTooltipModule} from "@angular/material/tooltip";
import {MatMenuModule} from "@angular/material/menu";
import { SettingsComponent } from './components/settings/settings.component';
import { MatExpansionModule} from "@angular/material/expansion";
import {TogglePasswordComponent} from "./components/toggle-password/toggle-password.component";
import {TrickyConfirmDialogComponent} from "./components/tricky-confirm-dialog/tricky-confirm-dialog.component";
import {BlockPasteDirective} from "./components/tricky-confirm-dialog/block-paste-directive";
import { ImageEditorDialogComponent } from './components/image-editor-dialog/image-editor-dialog.component';
import { MatSliderModule} from "@angular/material/slider";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {JDENTICON_CONFIG, NgxJdenticonModule} from "ngx-jdenticon";
import {DeactivateGuard} from "./services/can-deactivate";
import {DragDropModule} from "@angular/cdk/drag-drop";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {NgsRevealModule} from "ngx-scrollreveal";
import {ButtonLoadingDirective} from "./components/button-loading/button-loading.directive";
import { ServerStartInfoComponent } from './components/server-start-info/server-start-info.component';
import { SmoothProgressBarComponent } from './components/smooth-progress-bar/smooth-progress-bar.component';
import { ImagePopupComponent } from './components/recipe-page/image-popup/image-popup.component';
import { ProfilePictureComponent } from './components/profile-picture/profile-picture.component';
import { LikeButtonComponent } from './components/recipe-page/like-button/like-button.component';
import { CommentComponent } from './components/recipe-page/comment/comment.component';
import { BackButtonComponent } from './components/back-button/back-button.component';
import { IngredientLineComponent } from './components/recipe-page/ingredient-line/ingredient-line.component';
import {NgxLinkifyjsModule} from "ngx-linkifyjs";
import { InputLengthHintComponent } from './components/input-length-hint/input-length-hint.component';
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {MatSlideToggleModule} from "@angular/material/slide-toggle";


export const customTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 350,
  hideDelay: 0,
  touchendHideDelay: 0
};

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    EditRecipeComponent,
    RecipePageComponent,
    ConfirmDialogComponent,
    DragDropDirective,
    RecipePreviewComponent,
    CarouselComponent,
    CarouselItemElement,
    CarouselItemDirective,
    IngredientRowComponent,
    LoginComponent,
    LoginDialogComponent,
    NotFoundComponent,
    DateAgoPipe,
    SettingsComponent,
    TogglePasswordComponent,
    TrickyConfirmDialogComponent,
    BlockPasteDirective,
    ImageEditorDialogComponent,
    ButtonLoadingDirective,
    ServerStartInfoComponent,
    SmoothProgressBarComponent,
    ImagePopupComponent,
    ProfilePictureComponent,
    LikeButtonComponent,
    CommentComponent,
    BackButtonComponent,
    IngredientLineComponent,
    InputLengthHintComponent
  ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        AppRoutingModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        HttpClientModule,
        MatChipsModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatSelectModule,
        MatAutocompleteModule,
        MatListModule,
        MatRippleModule,
        MatDialogModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatMenuModule,
        MatExpansionModule,
        FormsModule,
        MatSliderModule,
        MatButtonToggleModule,
        NgxJdenticonModule,
        DragDropModule,
        MatCheckboxModule,
        NgsRevealModule,
        MatSlideToggleModule,
        NgxLinkifyjsModule.forRoot(),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
    ],
  entryComponents: [
    ConfirmDialogComponent,
    MatProgressSpinner
  ],
  providers: [
    LoginRouteGuard,
    AuthInterceptor,
    DeactivateGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useExisting: forwardRef(() => AuthInterceptor),
      multi: true
    },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: customTooltipDefaults },
    {
      // Custom identicon style
      // https://jdenticon.com/icon-designer.html?config=222222ff014132321e363f52
      provide: JDENTICON_CONFIG,
      useValue: {
        backColor: '#0000',
      },
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '/translations.json');
}
