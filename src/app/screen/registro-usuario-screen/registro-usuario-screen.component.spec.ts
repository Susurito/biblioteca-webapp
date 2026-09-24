import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroUsuarioScreenComponent } from './registro-usuario-screen.component';

describe('RegistroUsuarioScreenComponent', () => {
  let component: RegistroUsuarioScreenComponent;
  let fixture: ComponentFixture<RegistroUsuarioScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistroUsuarioScreenComponent]
    });
    fixture = TestBed.createComponent(RegistroUsuarioScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
