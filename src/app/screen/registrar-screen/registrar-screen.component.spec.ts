import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarScreenComponent } from './registrar-screen.component';

describe('RegistrarScreenComponent', () => {
  let component: RegistrarScreenComponent;
  let fixture: ComponentFixture<RegistrarScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistrarScreenComponent]
    });
    fixture = TestBed.createComponent(RegistrarScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
