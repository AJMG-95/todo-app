import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MenubarModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  constructor(private router: Router) { };

  items: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      {
        label: 'Tareas',
        icon: 'pi pi-check-square',
        routerLink: '/todo'
      },
      {
        label: 'Estadísticas',
        icon: 'pi pi-chart-line',
        routerLink: '/todo/stats'
      }
    ];
  }

  goToAbout() {
    this.router.navigate(['/todo/about']);
  }

}
