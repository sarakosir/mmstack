import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableCoreComponent } from './table-core.component';

describe('TableCoreComponent', () => {
  let component: TableCoreComponent;
  let fixture: ComponentFixture<TableCoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCoreComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
