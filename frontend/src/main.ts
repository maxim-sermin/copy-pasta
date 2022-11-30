import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import {TextZoom} from "@capacitor/text-zoom";
import {isPlatform} from "@ionic/angular";
import {StatusBar} from "@capacitor/status-bar"

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

if (isPlatform('mobile')) {
  TextZoom.set({value: 1.0});
  StatusBar.setBackgroundColor({color: '#19a96b'}); // please update me when theme changes
}
