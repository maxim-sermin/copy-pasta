import { Pipe, PipeTransform } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";

@Pipe({
  name: 'dateAgo',
  pure: true
})
export class DateAgoPipe implements PipeTransform {

  constructor(private translate: TranslateService) {
  }

  transform(value: any, args?: any): any {
    if (value) {
      const seconds = Math.floor((+new Date() - +new Date(value)) / 1000);
      const futurePast = Math.sign(seconds) > 0 ? this.translate.instant('datePipe.ago') : this.translate.instant('datePipe.in');
      const secondsAbs = Math.abs(seconds);
      if (secondsAbs < 29) // 30 seconds in the future or past will show as 'Just now'
        return this.translate.instant('datePipe.justNow');

      const intervals: Interval[] = [
        {duration: 31536000, singular: this.translate.instant('datePipe.intervals.year.singular'), plural: this.translate.instant('datePipe.intervals.year.plural')},
        {duration: 2592000, singular: this.translate.instant('datePipe.intervals.month.singular'), plural: this.translate.instant('datePipe.intervals.month.plural')},
        {duration: 604800, singular: this.translate.instant('datePipe.intervals.week.singular'), plural: this.translate.instant('datePipe.intervals.week.plural')},
        {duration: 86400, singular: this.translate.instant('datePipe.intervals.day.singular'), plural: this.translate.instant('datePipe.intervals.day.plural')},
        {duration: 3600, singular: this.translate.instant('datePipe.intervals.hour.singular'), plural: this.translate.instant('datePipe.intervals.hour.plural')},
        {duration: 60, singular: this.translate.instant('datePipe.intervals.minute.singular'), plural: this.translate.instant('datePipe.intervals.minute.plural')},
        {duration: 1, singular: this.translate.instant('datePipe.intervals.second.singular'), plural: this.translate.instant('datePipe.intervals.second.plural')}];

      let counter;
      for (const interval of intervals) {
        counter = Math.floor(secondsAbs / interval.duration);
        if (counter > 0) {
          let singularPlural = counter === 1 ? interval.singular : interval.plural;

          if (this.translate.langs.indexOf(this.translate.currentLang) === 0) { // german (default)
            return  `${futurePast} ${counter} ${singularPlural}`;
          } else {
            return  `${counter} ${singularPlural} ${futurePast}`;
          }
        }
      }
    }
    return value;
  }

}

interface Interval {
  duration: number;
  singular: string;
  plural: string;
}
