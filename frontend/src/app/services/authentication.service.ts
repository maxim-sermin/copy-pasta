import {EventEmitter, Injectable, Output} from '@angular/core';
import {Router} from "@angular/router";
import {BehaviorSubject, Observable} from "rxjs";
import {HttpRequest} from "@angular/common/http";
import {UsersEndpointService} from "../api/services";
import {tap} from "rxjs/operators";
import {User} from "../api/models/user";
import {ApplicationService} from "./application.service";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private _authenticated = null;
  public authenticatedUser: User = null;
  @Output() authenticationChangeEvent = new EventEmitter<boolean>();
  public profilePicture: string | ArrayBuffer;
  public triedRefresh: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private router: Router, private usersEndpointService: UsersEndpointService, private applicationService: ApplicationService) { }

  performLogin(name: string, password: string,): Observable<null> {
    return this.usersEndpointService.swaggerLoginUsingPOST({name: name, password: password}).pipe(tap(next => {
      this.triedRefresh.next(false);
      this.changeAuthenticated(true);
    }));
  }

  changeAuthenticated(isAuthenticated: boolean) {
    this._authenticated = isAuthenticated;
    this.authenticationChangeEvent.emit(isAuthenticated);
    if (isAuthenticated) {
      this.refreshUserInfo();
    }
  }

  public refreshUserInfo() {
    this.usersEndpointService.usernameAndIdUsingGET().subscribe(next => {
      this.authenticatedUser = next;
      if (this.authenticatedUser.pic) {
        this.applicationService.getImage(this.authenticatedUser.pic.id).subscribe(next => {
          this.createImageFromBlob(next);
        }, error => {
          console.log('Could not load profile picture of logged in user: ' + error);
        })
      } else {
        this.profilePicture = undefined;
      }
    })
  }

  performLogout(): void {
    this.usersEndpointService.swaggerLogoutUsingPOST().subscribe(next => {
      this.authenticatedUser = null;
      this.changeAuthenticated(false);
      this.router.navigate(['/']);
    }, error => {
    });
  }

  applyHeaders(req: HttpRequest<any>): HttpRequest<any> {
    return req.clone({
      withCredentials: true
    });
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.profilePicture = reader.result;
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }

  tryRefreshSession(): Observable<any> {
    return this.usersEndpointService.refreshSessionUsingPOST();
  }

  get authenticated(): boolean {
    return this._authenticated;
  }
}
