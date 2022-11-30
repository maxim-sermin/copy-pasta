import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {User} from "../../api/models/user";
import {ApplicationService} from "../../services/application.service";

@Component({
  selector: 'app-profile-picture',
  templateUrl: './profile-picture.component.html',
  styleUrls: ['./profile-picture.component.scss']
})
export class ProfilePictureComponent implements OnInit, AfterViewInit {

  @Input()
  public user: User;
  @Input()
  public sizePixels: number;
  @Input()
  public profilePictureOverride: string | ArrayBuffer;

  public profilePicture: string | ArrayBuffer;
  @ViewChild('profilePicContainer') profilePicContainer: ElementRef<HTMLDivElement>;

  constructor(public applicationService: ApplicationService) { }

  ngOnInit(): void {
    if (!this.profilePictureOverride) {
      if (this.user && this.user.pic) {
        this.applicationService.getImage(this.user.pic.id).subscribe(next => {
          this.createProfileImageFromBlob(next);
        }, error => {
          console.log('Could not load profile picture for recipe preview: ' + error);
        });
      }
    }
  }

  ngAfterViewInit(): void {
    // unfortunately, for the object-fit css property to work we need to specify the actual pixel dimensions
    const sizeString = this.sizePixels + 'px';
    this.profilePicContainer.nativeElement.style.width = sizeString;
    this.profilePicContainer.nativeElement.style.height = sizeString;
  }

  createProfileImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.profilePicture = reader.result;
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }
}
