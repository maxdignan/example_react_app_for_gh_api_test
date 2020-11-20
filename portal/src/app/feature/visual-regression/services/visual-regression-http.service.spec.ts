import { TestBed } from '@angular/core/testing';

import { VisualRegressionHttpService } from './visual-regression-http.service';

describe('VisualRegressionHttpService', () => {
  let service: VisualRegressionHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisualRegressionHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
