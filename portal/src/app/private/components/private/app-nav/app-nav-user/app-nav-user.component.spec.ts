import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderAppNavUserComponent } from './app-nav-user.component';

describe('ProviderAppNavUserComponent', () => {
  let component: ProviderAppNavUserComponent;
  let fixture: ComponentFixture<ProviderAppNavUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProviderAppNavUserComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderAppNavUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
