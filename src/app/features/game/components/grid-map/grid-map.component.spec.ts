import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridMapComponent } from './grid-map.component';

describe('GridMapComponent', () => {
  let component: GridMapComponent;
  let fixture: ComponentFixture<GridMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
