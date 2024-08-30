import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrusherComponent } from './crusher.component';

describe('CrusherComponent', () => {
  let component: CrusherComponent;
  let fixture: ComponentFixture<CrusherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrusherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrusherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
