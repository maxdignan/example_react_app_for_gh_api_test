import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { VisualRegressionEffects } from './visual-regression.effects';

describe('VisualRegressionEffects', () => {
  let actions$: Observable<any>;
  let effects: VisualRegressionEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VisualRegressionEffects,
        provideMockActions(() => actions$),
      ],
    });

    effects = TestBed.inject(VisualRegressionEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
