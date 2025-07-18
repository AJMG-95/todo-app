import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Creamos un espía (mock) para el Router
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: Router, useValue: routerSpy } // inyectamos el Router falso
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara ngOnInit()
  });

  // ✅ Verifica que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ✅ Verifica que se inicializan correctamente los items del menú
  it('should initialize menu items on ngOnInit', () => {
    expect(component.items.length).toBeGreaterThan(0);
    expect(component.items[0].label).toBe('Tareas');
    expect(component.items[1].label).toBe('Estadísticas');
  });

  // ✅ Verifica que se navega correctamente al hacer clic en el logo
  it('should navigate to /todo/about when logo is clicked', () => {
    const logoElement = fixture.debugElement.query(By.css('span.cursor-pointer'));
    logoElement.triggerEventHandler('click', null);

    // Esperamos que Router.navigate haya sido llamado con ['/todo/about']
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/todo/about']);
  });
});
