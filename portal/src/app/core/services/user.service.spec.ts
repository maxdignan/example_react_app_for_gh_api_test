import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { Apollo } from 'apollo-angular';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Store,
          useValue: {},
        },
        {
          provide: Apollo,
          useValue: {},
        },
      ],
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
