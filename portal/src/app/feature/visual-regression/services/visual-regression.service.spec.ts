import { TestBed } from '@angular/core/testing';

import { VisualRegressionService } from './visual-regression.service';

describe('VisualRegressionService', () => {
  let service: VisualRegressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisualRegressionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
