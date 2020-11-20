import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualRegressionComponent } from './visual-regression.component';

describe('VisualRegressionComponent', () => {
  let component: VisualRegressionComponent;
  let fixture: ComponentFixture<VisualRegressionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VisualRegressionComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualRegressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
