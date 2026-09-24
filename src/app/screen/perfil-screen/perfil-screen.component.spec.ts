import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilScreenComponent } from './perfil-screen.component';

describe('PerfilScreenComponent', () => {
  let component: PerfilScreenComponent;
  let fixture: ComponentFixture<PerfilScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PerfilScreenComponent]
    });
    fixture = TestBed.createComponent(PerfilScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
