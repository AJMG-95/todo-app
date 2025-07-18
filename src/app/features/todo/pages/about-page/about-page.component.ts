import { Component } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    ChipModule,
    DividerModule,
    CardModule,
    AvatarModule,
    ButtonModule,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent { }
