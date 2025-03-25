import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormAdaptersComponent } from './form-adapters.component';

describe('FormAdaptersComponent', () => {
  let component: FormAdaptersComponent;
  let fixture: ComponentFixture<FormAdaptersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAdaptersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormAdaptersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
