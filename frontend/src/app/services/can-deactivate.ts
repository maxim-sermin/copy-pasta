import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmDialogComponent} from "../components/confirm-dialog/confirm-dialog.component";
import {NoopScrollStrategy} from "@angular/cdk/overlay";
import {Observable} from "rxjs";
import {TranslateService} from "@ngx-translate/core";

export interface CanComponentDeactivate {
  requireConfirm(): boolean;
}

@Injectable()
export class DeactivateGuard implements CanDeactivate <CanComponentDeactivate> {

  constructor(private matDialog: MatDialog, private translate: TranslateService) {
  }

  canDeactivate(
    component: CanComponentDeactivate,
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    if(component.requireConfirm()) {
      const dialogRef = this.matDialog.open(ConfirmDialogComponent, {
        scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
      });

      dialogRef.componentInstance.dialogTitle = this.translate.instant('routeGuard.dialog.title');
      dialogRef.componentInstance.dialogMessageFirstLine = this.translate.instant('routeGuard.dialog.body');

      return dialogRef.afterClosed();
    }

    return true;
  }
}
