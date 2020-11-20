import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormStatusErrorComponent } from './form-status-error.component';

describe('FormStatusErrorComponent', () => {
  let component: FormStatusErrorComponent;
  let fixture: ComponentFixture<FormStatusErrorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormStatusErrorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormStatusErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
