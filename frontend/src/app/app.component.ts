import { Component } from '@angular/core';
import {AuthenticationService} from "./services/authentication.service";
import {ApplicationService} from "./services/application.service";
import {Router} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";
import {ApiConfiguration} from "./api/api-configuration";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'copy-pasta-frontend';

  constructor(public authenticationService: AuthenticationService, public applicationService: ApplicationService, private router: Router, public translate: TranslateService, private apiConfiguration: ApiConfiguration) {
    // this is required for the app
    if (!this.apiConfiguration.rootUrl.includes('localhost')) {
      this.apiConfiguration.rootUrl = 'https:' + this.apiConfiguration.rootUrl;
    }

    translate.addLangs(['de', 'en']);
    translate.setDefaultLang('de');
    const languageFromLocal = localStorage.getItem('lang');
    if (languageFromLocal !== null) {
      translate.use(languageFromLocal);
    } else {
      translate.use('de');
    }
  }

  public goHome() {
    this.router.navigate(['/overview']).then(r => window.location.reload());
  }

  useLanguage(previous: boolean): void {
    let langIndex = this.translate.langs.indexOf(this.translate.currentLang);
    if (previous) {
      langIndex--;
    } else  {
      langIndex++;
    }
    const langsLength = this.translate.langs.length;
    const arrayIndex = (langIndex % langsLength + langsLength) % langsLength;
    const newLang = this.translate.langs[arrayIndex];
    this.translate.use(newLang);
    localStorage.setItem('lang', newLang);
  }
}
