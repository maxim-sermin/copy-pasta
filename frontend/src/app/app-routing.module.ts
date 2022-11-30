import {RouterModule, Routes} from "@angular/router";
import {LandingComponent} from "./components/landing/landing.component";
import {NgModule} from "@angular/core";
import {EditRecipeComponent} from "./components/edit-recipe/edit-recipe.component";
import {RecipePageComponent} from "./components/recipe-page/recipe-page.component";
import {LoginComponent} from "./components/login/login.component";
import {NotFoundComponent} from "./components/not-found/not-found.component";
import {LoginRouteGuard} from "./services/login-route-guard";
import {SettingsComponent} from "./components/settings/settings.component";
import {DeactivateGuard} from "./services/can-deactivate";

const routes: Routes = [
  {path: '', component: LoginComponent },
  {path: 'overview', canActivate: [ LoginRouteGuard ], component: LandingComponent},
  {path: 'edit', canActivate: [ LoginRouteGuard ], canDeactivate: [DeactivateGuard], component: EditRecipeComponent}, // create new recipe
  {path: 'edit/:id', canActivate: [ LoginRouteGuard ], canDeactivate: [DeactivateGuard], component: EditRecipeComponent}, // edit existing recipe
  {path: 'recipe/:id', canActivate: [ LoginRouteGuard ], component: RecipePageComponent},
  {path: 'settings', canActivate: [ LoginRouteGuard ], component: SettingsComponent},
  {path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})

export class AppRoutingModule {

}
