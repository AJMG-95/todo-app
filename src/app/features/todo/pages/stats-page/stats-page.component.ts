import { Component } from '@angular/core';
import { GameCard } from '../../../../shared/components/card-data/card-data.component';
import { CardModal } from '../../../../shared/components/card-modal/card-modal.component';

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [
    GameCard,
    CardModal
  ],
  templateUrl: './stats-page.component.html',
  styleUrl: './stats-page.component.css'
})
export class StatsPageComponent {

}
