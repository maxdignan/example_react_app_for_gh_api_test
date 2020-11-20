import { TestBed } from '@angular/core/testing';

import { Apollo } from 'apollo-angular';
import { UserHttpService } from './user-http.service';

describe('UserHttpService', () => {
  let service: UserHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Apollo,
          useValue: {},
        },
      ],
    });
    service = TestBed.inject(UserHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
