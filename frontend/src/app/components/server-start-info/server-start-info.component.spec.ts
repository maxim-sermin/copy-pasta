import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerStartInfoComponent } from './server-start-info.component';

describe('ServerStartInfoComponent', () => {
  let component: ServerStartInfoComponent;
  let fixture: ComponentFixture<ServerStartInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServerStartInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerStartInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
