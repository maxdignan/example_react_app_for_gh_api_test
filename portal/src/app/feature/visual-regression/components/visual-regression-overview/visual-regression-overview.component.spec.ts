import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualRegressionOverviewComponent } from './visual-regression-overview.component';

describe('VisualRegressionOverviewComponent', () => {
  let component: VisualRegressionOverviewComponent;
  let fixture: ComponentFixture<VisualRegressionOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VisualRegressionOverviewComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualRegressionOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
