import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualRegressionMetadataComponent } from './visual-regression-metadata.component';

describe('VisualRegressionMetadataComponent', () => {
  let component: VisualRegressionMetadataComponent;
  let fixture: ComponentFixture<VisualRegressionMetadataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VisualRegressionMetadataComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualRegressionMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
