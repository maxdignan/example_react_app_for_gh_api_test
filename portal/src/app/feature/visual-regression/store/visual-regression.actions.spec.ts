import * as fromVisualRegression from './visual-regression.actions';

describe('loadVisualRegressions', () => {
  it('should return an action', () => {
    expect(fromVisualRegression.loadVisualRegressions().type).toBe(
      '[VisualRegression] Load VisualRegressions',
    );
  });
});
