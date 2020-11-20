import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { ActionStatus } from '@app/shared/models';
import { UserService } from '@app/core/core.module';

@Component({
  selector: 'art-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  public status$: Observable<ActionStatus>;
  public form: FormGroup;

  public readonly version = environment.version;
  public readonly statuses = ActionStatus;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private userService: UserService,
  ) {}

  ngOnInit() {
    // clear any latent data
    this.userService.logout();
    this.form = this.getForm();
    // cache return so we can hit it once successful
    const returnUrl =
      this.route.snapshot.queryParams.returnUrl || '/dashboard';
    this.form.patchValue({ returnUrl }, { emitEvent: false });
    this.status$ = this.userService.getStatus();
  }

  private getForm(): FormGroup {
    return this.fb.group({
      email: [
        environment.production ? '' : 'brizad@gmail.com',
        [Validators.required, Validators.email],
      ],
      password: [
        environment.production ? '' : 'password',
        Validators.required,
      ],
      returnUrl: null,
    });
  }

  public onSubmit() {
    if (this.form.valid) {
      this.userService.login(this.form.value);
    } else {
      this.form.controls.email.markAsDirty();
      this.form.controls.password.markAsDirty();
    }
  }
}
