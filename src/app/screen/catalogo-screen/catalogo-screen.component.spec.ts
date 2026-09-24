import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoScreenComponent } from './catalogo-screen.component';

describe('CatalogoScreenComponent', () => {
  let component: CatalogoScreenComponent;
  let fixture: ComponentFixture<CatalogoScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CatalogoScreenComponent]
    });
    fixture = TestBed.createComponent(CatalogoScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
