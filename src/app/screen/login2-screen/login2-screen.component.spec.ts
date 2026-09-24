import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login2ScreenComponent } from './login2-screen.component';

describe('Login2ScreenComponent', () => {
  let component: Login2ScreenComponent;
  let fixture: ComponentFixture<Login2ScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Login2ScreenComponent]
    });
    fixture = TestBed.createComponent(Login2ScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
