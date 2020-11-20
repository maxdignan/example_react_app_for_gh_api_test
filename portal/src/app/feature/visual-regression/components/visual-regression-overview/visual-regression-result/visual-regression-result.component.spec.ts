import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualRegressionResultComponent } from './visual-regression-result.component';

describe('VisualRegressionResultComponent', () => {
  let component: VisualRegressionResultComponent;
  let fixture: ComponentFixture<VisualRegressionResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VisualRegressionResultComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualRegressionResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
