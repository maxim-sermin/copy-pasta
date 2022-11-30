import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-toggle-password',
  templateUrl: './toggle-password.component.html',
  styleUrls: ['./toggle-password.component.scss']
})
export class TogglePasswordComponent {

  constructor() { }

  @Input()
  isVisible: boolean;

  _type: Type = 'text';

  get type() {
    return this.isVisible ? 'text' : 'password';
  }
}

type Type = 'text' | 'password' ;
