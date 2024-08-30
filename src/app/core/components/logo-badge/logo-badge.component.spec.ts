import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoBadgeComponent } from './logo-badge.component';

describe('LogoBadgeComponent', () => {
  let component: LogoBadgeComponent;
  let fixture: ComponentFixture<LogoBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogoBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
