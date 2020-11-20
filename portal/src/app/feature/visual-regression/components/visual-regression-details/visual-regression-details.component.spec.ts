import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualRegressionDetailsComponent } from './visual-regression-details.component';

describe('VisualRegressionDetailsComponent', () => {
  let component: VisualRegressionDetailsComponent;
  let fixture: ComponentFixture<VisualRegressionDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VisualRegressionDetailsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualRegressionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
