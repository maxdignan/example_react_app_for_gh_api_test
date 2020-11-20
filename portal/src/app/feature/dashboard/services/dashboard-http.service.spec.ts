import { TestBed } from '@angular/core/testing';

import { DashboardHttpService } from './dashboard-http.service';

describe('DashboardHttpService', () => {
  let service: DashboardHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
