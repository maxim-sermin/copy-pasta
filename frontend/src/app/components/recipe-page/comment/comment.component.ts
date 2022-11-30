import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Comment} from "../../../api/models/comment";
import {FormControl, Validators} from "@angular/forms";
import {AuthenticationService} from "../../../services/authentication.service";
import {ConfirmDialogComponent} from "../../confirm-dialog/confirm-dialog.component";
import {NoopScrollStrategy} from "@angular/cdk/overlay";
import {MatDialog} from "@angular/material/dialog";
import {ApplicationService} from "../../../services/application.service";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {

  @Input()
  public editMode = false;
  @Input()
  public existingComment: Comment = null;
  @Output()
  public commentAdded = new EventEmitter<string>();
  @Output()
  public commentDeleted = new EventEmitter<number>();
  @Output()
  public commentUpdated = new EventEmitter<any>();

  @Input()
  public commentUpdatedResponse;

  constructor(public authenticationService: AuthenticationService, private matDialog: MatDialog, private translate: TranslateService) { }

  public commentContent: FormControl = new FormControl(this.existingComment ? this.existingComment.content : '', [Validators.required, Validators.maxLength(ApplicationService.LONG_TEXT_LIMIT)]);

  ngOnInit(): void {
    // when some comment was successfully updated, all comment-components catch this event -> when this is the one then disable edit mode
    if (this.commentUpdatedResponse) {
      this.commentUpdatedResponse.subscribe(next => {
        if (this.existingComment && this.existingComment.id === next) {
          this.editMode = false;
        }
      });
    }
  }

  public toggleEditing() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.commentContent.patchValue(this.existingComment.content);
    }
  }

  public tryDeleteComment() {
    const dialogRef = this.matDialog.open(ConfirmDialogComponent, {
      scrollStrategy: new NoopScrollStrategy() // this is super important now! without it pages with scroll will get squashed!
    });

    dialogRef.componentInstance.dialogTitle = this.translate.instant('recipe.comments.dialog.delete.title');
    dialogRef.componentInstance.dialogMessageFirstLine = this.translate.instant('generic.noUndo');

    dialogRef.afterClosed().subscribe(next => {
      if (next) {
        this.commentDeleted.emit(this.existingComment.id);
      }
    })
  }
}
