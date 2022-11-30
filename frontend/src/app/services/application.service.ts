import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {ApiConfiguration} from "../api/api-configuration";
import {User} from "../api/models/user";
import {UsersEndpointService} from "../api/services/users-endpoint.service";

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  public static LONG_TEXT_LIMIT = 15000;
  public static LONG_TEXT_SHOW_THRESHOLD = 12000;
  public static SHORT_TEXT_LIMIT = 255;
  public static SHORT_TEXT_SHOW_THRESHOLD = 205;

  public landingRecipeNameSearch: string = '';
  public landingAdvancedSearchLabelsJSON: string; // circumvent pass-by-reference so this and state in landing page can stay decoupled
  private PING_BACKEND_MINUTES = 10;

  constructor(private httpClient: HttpClient, private config: ApiConfiguration, private usersEndpointService: UsersEndpointService) {
    // call backend periodically to prevent heroku from making it sleep
    setInterval(() => {
      this.usersEndpointService.checkSessionUsingGET().subscribe(); // results are like totally irrelevant here
    }, this.PING_BACKEND_MINUTES * 60 * 1000)
  }

  public static getRandomIntBetween(min, max): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  public static getRandomInt(max): number {
    return ApplicationService.getRandomIntBetween(0, max);
  }

  public static isInViewport(element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  getImage(imageId: number): Observable<Blob> {
    return this.httpClient.get(this.config.rootUrl + '/pictures/' + imageId, { responseType: 'blob' });
  }

  public getProfilePictureOffsetSafe(user: User) {
    if (user) {
      return user.picOffsetX + '%' + ' ' + user.picOffsetY + '%'
    } else {
      return '0% 0%'
    }
  }

  public getProfilePictureRotationSafe(user: User) {
    if (user && user.pic) {
      return 'rotate(' + user.pic.rotation + 'deg)';
    } else {
      return 'rotate(0deg)';
    }
  }
}

export interface EditorDialogData {
  fileToUpload: FileToUpload,
  maxAllowedSize: number;
}

export interface FileToUpload {
  file: File, uploadProgress: number, uploadStatus: UploadStatus, isDuplicate: boolean, isTooLarge: boolean, compressedData?: any, rotation: number
}

export enum UploadStatus {
  pending, success, failed
}
