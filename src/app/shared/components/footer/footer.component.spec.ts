import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { By } from '@angular/platform-browser';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent] // standalone component import
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara el renderizado del template
  });

  // ✅ Verifica que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ✅ Verifica que el año actual esté bien calculado
  it('should set the current year correctly', () => {
    const currentYear = new Date().getFullYear();
    expect(component.currentYear).toBe(currentYear);
  });

  // ✅ Verifica que el DOM muestra el texto con el año actual
  it('should render copyright with current year', () => {
    const compiled = fixture.debugElement.nativeElement as HTMLElement;
    const paragraph = compiled.querySelector('p');
    expect(paragraph?.textContent).toContain(`${new Date().getFullYear()} ToDoApp`);
  });
});
