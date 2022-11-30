import {Component, Input, OnInit} from '@angular/core';
import {ApplicationService} from "../../services/application.service";

@Component({
  selector: 'app-input-length-hint',
  templateUrl: './input-length-hint.component.html',
  styleUrls: ['./input-length-hint.component.scss']
})
export class InputLengthHintComponent implements OnInit {

  @Input()
  public input: HTMLInputElement;
  @Input()
  public longText = false;

  constructor() { }

  ngOnInit(): void {
  }

  public get textLimit() {
    return this.longText ? ApplicationService.LONG_TEXT_LIMIT : ApplicationService.SHORT_TEXT_LIMIT;
  }

  public get textThreshold() {
    return this.longText ? ApplicationService.LONG_TEXT_SHOW_THRESHOLD : ApplicationService.SHORT_TEXT_SHOW_THRESHOLD;
  }
}
