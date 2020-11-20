import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Apollo } from 'apollo-angular';
import { Subject } from 'rxjs';

import { AuthService } from '@app/core/services/auth.service';
import { UserService } from '@app/core/services/user.service';
import { UserEffects } from './user.effects';

describe('user effects', () => {
  let actions$: Subject<any>;
  let effects: UserEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        UserEffects,
        provideMockActions(() => actions$),
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: Apollo,
          useValue: {},
        },
      ],
    });
    actions$ = new Subject();
    effects = TestBed.inject(UserEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
