import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import {AuthenticationService} from "./authentication.service";
import {UsersEndpointService} from "../api/services/users-endpoint.service";

@Injectable()
export class LoginRouteGuard implements CanActivate {

  constructor(private router: Router, private authenticationService: AuthenticationService, private usersEndpointService: UsersEndpointService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkRoute(state.url);
  }

  // this is public so login component can call it manually
  public checkRoute(wantedUrl: string): boolean {
    if (this.authenticationService.authenticated === null) {
      console.log(`Attempted to access route '${wantedUrl}' which requires authentication with unknown session state - going to check on server`);

      this.usersEndpointService.checkSessionUsingGET().subscribe(next => {
        return this.continueWantedRoute(wantedUrl);
      }, error => {
        // at this point the authenticated variable was already set
        this.handleAuthenticatedState(wantedUrl);
      });

      return false;
    }

    return this.handleAuthenticatedState(wantedUrl);
  }

  private continueWantedRoute(wantedUrl: string) {
    console.log('Session turned out be valid, proceeding to desired route');
    this.authenticationService.changeAuthenticated(true);
    this.router.navigate([wantedUrl]);
    return true;
  }

  private handleAuthenticatedState(wantedUrl: string) {
    if (!this.authenticationService.authenticated) {
      if (!this.authenticationService.triedRefresh.value) {
        this.authenticationService.triedRefresh.next(true);
        console.log("[Guard] Did not try to refresh the session yet, gonna try now");

        this.authenticationService.tryRefreshSession().subscribe(next => {
          console.log("[Guard] Successfully refreshed session, carry on");
          this.authenticationService.triedRefresh.next(false);
          return this.continueWantedRoute(wantedUrl);
        }, error => {
          return this.redirectLoginPage();
        })
      } else {
        console.log("[Guard] Already tried to refresh the session, gonna open login dialog");
        return this.redirectLoginPage();
      }
    } else {
      return true;
    }
  }

  private redirectLoginPage() {
    console.log('Redirecting to login');
    this.router.navigate(['/']);
    return false;
  }
}
