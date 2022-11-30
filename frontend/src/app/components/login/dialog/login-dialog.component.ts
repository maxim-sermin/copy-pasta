import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";
import {AuthenticationService} from "../../../services/authentication.service";

@Component({
  selector: 'app-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<LoginDialogComponent>, private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    this.authenticationService.authenticationChangeEvent.subscribe(next => {
      if (next) {
        this.dialogRef.close(true);
      }
    })
  }

}
