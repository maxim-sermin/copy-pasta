import {AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AuthenticationService} from "../../services/authentication.service";
import {UsersEndpointService} from "../../api/services/users-endpoint.service";
import {ApplicationService} from "../../services/application.service";
import {TranslateService} from "@ngx-translate/core";
import {LoginRouteGuard} from "../../services/login-route-guard";
import {AvailableResult, Credentials, NativeBiometric} from "capacitor-native-biometric";
import {isPlatform} from "@ionic/angular";
import {ApiConfiguration} from "../../api/api-configuration";
import {Toast} from "@capacitor/toast";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {

  public loginInProgress = false;
  public svgs = ['cavatappi.svg', 'farfalle.svg', 'farfalloni.svg', 'fusilli_bucati.svg', 'garganelli.svg', 'macaroni.svg', 'mafalde.svg', 'maltagliati.svg', 'penne.svg', 'pennoni_lisci.svg', 'ravioli.svg', 'riccioli.svg', 'riccioli_di_sfoglia.svg', 'rigatoni.svg', 'rotelle.svg', 'rotini.svg', 'ruote.svg', 'sedani_rigati.svg', 'spaghetti.svg', 'ziti.svg'];
  public currentSvgIndex = ApplicationService.getRandomInt(this.svgs.length);
  private animationTimeMs = 3500; // actually 3sec - add some delay until text appears
  private delayBetweenAnimationsMs = 5500;
  private fadeTimeMs = 1000;
  private createdObjectElement;
  public showSvgName = false;
  public biometricAvailable = false;
  public showBiometricLoginButton = false;

  constructor(private router: Router, private renderer: Renderer2, private authenticationService: AuthenticationService, private usersEndpointService: UsersEndpointService, private translate: TranslateService, private loginRouteGuard: LoginRouteGuard, private apiConfig: ApiConfiguration) { }

  ngOnInit() {
    this.checkBiometricDataStored();

    this.authenticationService.triedRefresh.subscribe(triedRefresh => {
      if (triedRefresh) {
        this.performBiometricLogin();
      }
    })

    console.log("Going to call checkRoute on guard with '/overview'")
    this.loginRouteGuard.checkRoute('/overview');

    if (isPlatform('mobile')) {
      NativeBiometric.isAvailable().then((result: AvailableResult) => {
        this.biometricAvailable = result.isAvailable;
      });
    }
  }

  private checkBiometricDataStored() {
    if (isPlatform('mobile')) {
      NativeBiometric.isAvailable().then((result: AvailableResult) => {
        if (result.isAvailable) {
          // Get user's credentials
          NativeBiometric.getCredentials({
            server: this.apiConfig.rootUrl,
          }).then((credentials: Credentials) => {
            this.showBiometricLoginButton = true;
          }, (error) => {
            console.log('Hiding biometric login button: ' + error.message);
            this.showBiometricLoginButton = false;
          });
        }
      });
    }
  }

  public performBiometricLogin() {
    if (isPlatform('mobile')) {
      NativeBiometric.isAvailable().then((result: AvailableResult) => {
        if (result.isAvailable) {
          // Get user's credentials
          NativeBiometric.getCredentials({
            server: this.apiConfig.rootUrl,
          }).then((credentials: Credentials) => {
            // Authenticate using biometrics before logging the user in
            NativeBiometric.verifyIdentity({
              title: this.translate.instant('login.loginButtonBiometric'),
              subtitle: this.translate.instant('login.biometric.promptSubTitle')
            }).then(() => {
                // Authentication successful
                this.form.controls['name'].patchValue(credentials.username);
                this.form.controls['password'].patchValue(credentials.password);
                this.submit();
              }, (error) => {
                Toast.show({text: this.translate.instant('login.biometric.verifyError'), duration: "long"});
                console.log('Something went wrong while verifying biometric identity for login: ' + error.message);
                this.showBiometricLoginButton = true;
              }
            );
          }, (error) => {
            console.log('Something went wrong while getting biometric credentials for login: ' + error.message);
          });
        }
      });
    }
  }

  ngAfterViewInit(): void {
    this.runSvgAnimation();
  }

  @ViewChild('errorBox', {static: false, read: ElementRef}) errorBox: ElementRef;
  @ViewChild('imgContainer', {static: true, read: ElementRef}) imgContainer: ElementRef;
  @ViewChild('nameRibbon', {static: false, read: ElementRef}) nameRibbon: ElementRef;

  form: FormGroup = new FormGroup({
    name: new FormControl("", [Validators.required]),
    password: new FormControl("", Validators.required),
    useBiometric: new FormControl(false)
  });

  private runSvgAnimation() {
    this.reCreateSvgElement();

    setTimeout(() =>  { // wait for svg animation to complete before showing text
      this.showSvgName = true;

      setTimeout(() => { // keep svg and text for reading
        if (this.nameRibbon) { // this is null when navigating away at a certain point in the animation
          this.renderer.addClass(this.createdObjectElement, 'fade-content');
          this.renderer.addClass(this.nameRibbon.nativeElement, 'ribbon-fade');
          for (const child of this.nameRibbon.nativeElement.children) {
            this.renderer.addClass(child, 'fade-content');
          }

          setTimeout(() => { // fade for svg and text fade to complete
            this.showSvgName = false;
            this.updateSvgIndex();
            this.runSvgAnimation();
          }, this.fadeTimeMs)
        }
      }, this.delayBetweenAnimationsMs)

    }, this.animationTimeMs)
  }

  private reCreateSvgElement() {
    if (this.createdObjectElement) {
      this.renderer.removeChild(this.imgContainer, this.createdObjectElement);
    }
    this.createdObjectElement = this.renderer.createElement('object');
    this.renderer.addClass(this.createdObjectElement, 'login-logo');
    this.renderer.appendChild(this.imgContainer.nativeElement, this.createdObjectElement);
    this.renderer.setAttribute(this.createdObjectElement, "data", 'assets/pasta-svgs/' + this.svgs[this.currentSvgIndex]);
    this.renderer.setAttribute(this.createdObjectElement, "type", 'image/svg+xml');
  }

  public currentSvgFilenameToDisplayName(): string {
    let filename = this.svgs[this.currentSvgIndex];
    filename = filename.substring(0, filename.lastIndexOf('.'));

    let capitalized = [];
    for (const word of filename.split('_')) {
      capitalized.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
    return capitalized.join(' ');
  }

  private updateSvgIndex() {
    let nextSvgCandidate = this.currentSvgIndex;
    while (nextSvgCandidate == this.currentSvgIndex) {
      nextSvgCandidate = ApplicationService.getRandomInt(this.svgs.length);
    }
    this.currentSvgIndex = nextSvgCandidate;
  }

  submit() {
    if (this.form.valid) {
      this.loginInProgress = true;
      this.authenticationService.performLogin(this.form.value.name, this.form.value.password).subscribe(next => {
        if (this.form.value.useBiometric) {
          if (this.biometricAvailable) {
            // Authenticate using biometrics before storing credentials
            NativeBiometric.verifyIdentity({
              title: this.translate.instant('login.biometric.toggle'),
              subtitle: this.translate.instant('login.biometric.storePromptSubTitle')
            }).then(() => {
                NativeBiometric.setCredentials({
                  username: this.form.value.name,
                  password: this.form.value.password,
                  server: this.apiConfig.rootUrl,
                }).then(() => {
                  console.log('Successfully stored biometric credentials');
                  this.completeLogin();
                }, (error) => {
                  Toast.show({text: this.translate.instant('login.biometric.storeError'), duration: "long"});
                  console.log('Something went wrong while storing biometric credentials: ' + error.message);
                  this.loginInProgress = false;
                });
              }, (error) => {
                Toast.show({text: this.translate.instant('login.biometric.verifyError'), duration: "long"});
                console.log('Something went wrong while verifying biometric identity for storing data: ' + error.message);
                this.loginInProgress = false;
              }
            );
          } else {
            Toast.show({text: this.translate.instant('login.biometric.notAvailable'), duration: "long"});
            console.log("Could not use biometric login because it is not available");
            this.loginInProgress = false;
          }
        } else {
          this.completeLogin();
        }
      }, error => {
        this.loginInProgress = false;
        if (error.status === 403) {
          this.error = this.translate.instant('login.errors.wrongCreds');
        } else if (error.status === 0) {
          this.error = this.translate.instant('login.errors.unavailable');
        } else {
          this.error = this.translate.instant('login.errors.genericError');
        }
        this.renderer.setStyle(this.errorBox.nativeElement, 'visibility', 'visible');
      })
    } else {
      this.error = this.translate.instant('login.errors.enterCreds');
      this.renderer.setStyle(this.errorBox.nativeElement, 'visibility', 'visible');
    }
  }

  private completeLogin() {
    this.loginInProgress = false;
    this.router.navigate(['/overview']);
  }

  @Input() error: string | null;
}
