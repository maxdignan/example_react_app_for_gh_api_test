import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { UserService } from '@app/core/services/user.service';

describe('login component', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        RouterTestingModule,
      ],
      declarations: [LoginComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: UserService,
          useValue: {
            getStatus: () => of(),
            getError: () => of(),
            login: () => {},
            logout: () => {},
          },
        },
      ],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets a default return url to `/jobs`', () => {
    expect(component.form.value.returnUrl).toBe('/jobs');
  });

  it('sets a return url from url params', () => {
    const route = TestBed.inject(ActivatedRoute);
    const url = '/test';
    route.snapshot.queryParams.returnUrl = url;
    component.ngOnInit();
    expect(component.form.value.returnUrl).toBe(url);
  });

  it('dispatches a loading action on submit with form data', () => {
    const service = TestBed.inject(UserService);
    service.login = jest.fn();
    component.form.patchValue({
      email: 'test-user@test.com',
      password: 'test-password',
    });
    component.onSubmit();
    const fn = service.login as jest.Mock;
    const formValue = fn.mock.calls[0][0];
    expect(formValue).toHaveProperty('email');
    expect(formValue).toHaveProperty('password');
    expect(formValue).toHaveProperty('returnUrl');
  });
});
