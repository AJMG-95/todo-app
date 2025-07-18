import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

// Necesitamos simular ActivatedRoute porque Navbar lo usa internamente
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();
  });

  // Verifica que el componente se crea correctamente
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy(); // el componente se ha instanciado correctamente
  });

  // Verifica que la propiedad title del componente tenga el valor esperado
  it(`should have the 'todo-app' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('todo-app'); // debe coincidir con el valor en la clase
  });

});
