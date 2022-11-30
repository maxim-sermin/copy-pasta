import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {tap} from "rxjs/operators";
import {AuthenticationService} from "./authentication.service";
import {Router} from "@angular/router";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {LoginDialogComponent} from "../components/login/dialog/login-dialog.component";
import {NoopScrollStrategy} from "@angular/cdk/overlay";
import {ServerStartInfoComponent} from "../components/server-start-info/server-start-info.component";

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  public TIME_BEFORE_POPUP = 5; // i.e. time we expect the longest backend call to legitimately take
  public waitForServerResponse;
  public dialogOpen: MatDialogRef<ServerStartInfoComponent>;

  constructor(private authenticationService: AuthenticationService, private router: Router, private dialog: MatDialog) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const withHeaders = this.authenticationService.applyHeaders(req);

    if (!this.waitForServerResponse && !this.dialogOpen) {
      this.waitForServerResponse = setTimeout(() => {
        this.showPopup();
      }, this.TIME_BEFORE_POPUP * 1000);
    }

    return next.handle(withHeaders).pipe(
      tap(x => {
        if (x.type !== 0) { // 0 is when the request was just sent
          this.clearWaiting();
        }
        return x;
        },
        err => {
          this.clearWaiting();
          console.log(`Error performing request, status code = ${err.status}`);
          if (err.status === 0) {
            console.log("This indicates a failed CORS pre-flight check. Since CORS is enabled on server-side, this most probably means that the server did not respond at all")
          } else if (err.status === 403) {
            console.log("User not authenticated");
            this.authenticationService.changeAuthenticated(false);

            if (!err.url.includes('/checkSession') && this.router.url !== '/' && this.dialog.openDialogs.length < 1) {
              console.log("The failed request was not just for probing if the session is still valid");

              if (!this.authenticationService.triedRefresh.value) {
                this.authenticationService.triedRefresh.next(true);
                console.log("[Interceptor] Did not try to refresh the session yet, gonna try now");

                this.authenticationService.tryRefreshSession().subscribe(next => {
                  // todo it would be nice to retry the request here but it is damn hard :/
                  console.log("[Interceptor] Successfully refreshed session, carry on");
                  this.authenticationService.triedRefresh.next(false);
                }, error => {
                  this.openLoginDialog();
                })
              } else {
                console.log("[Interceptor] Already tried to refresh the session, gonna open login dialog");
                this.openLoginDialog();
              }
            }
          }
        })
    );
  }

  private openLoginDialog() {
    this.dialog.open(LoginDialogComponent, {
      width: '800px',
      maxHeight: '100vh',
      position: {
        top: '5vh',
      },
      panelClass: 'global-dialog-class',
      scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
    });
  }

  private showPopup() {
    this.dialogOpen = this.dialog.open(ServerStartInfoComponent, {
      scrollStrategy: new NoopScrollStrategy(), // this is super important now! without it pages with scroll will get squashed!
      hasBackdrop: false,
      position: {
        top: '80px',
        right: '30px'
      }
    })
    this.dialogOpen.afterClosed().subscribe(next => {
      this.dialogOpen = undefined;
    })
  }

  private clearWaiting() {
    if (this.waitForServerResponse) {
      clearTimeout(this.waitForServerResponse);
      this.waitForServerResponse = undefined;
    }
    if (this.dialogOpen) {
      this.dialogOpen.componentInstance.handleServerStarted();
    }
  }
}
