import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalService } from '@app/core/services/modal.service';
import { ProgressButtonComponent } from '../progress-button/progress-button.component';
import { LoadingIndicatorComponent } from '../loading-indicator/loading-indicator.component';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProgressButtonComponent,
        LoadingIndicatorComponent,
        ModalComponent,
      ],
      providers: [
        {
          provide: ModalService,
          useValue: {},
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    component.config = {};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
