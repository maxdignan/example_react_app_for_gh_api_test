import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppNavComponent } from './app-nav.component';
import { ProviderAppNavLinkComponent } from './provider-app-nav-link/provider-app-nav-link.component';
import { ProviderAppNavUserComponent } from './provider-app-nav-user/provider-app-nav-user.component';

describe('ProviderAppNavComponent', () => {
  let component: AppNavComponent;
  let fixture: ComponentFixture<AppNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [
        AppNavComponent,
        ProviderAppNavLinkComponent,
        ProviderAppNavUserComponent,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
