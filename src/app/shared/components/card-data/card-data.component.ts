import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

export interface CardData {
  imageId: string;
  state: 'default' | 'flipped' | 'matched';
}

@Component({
  selector: 'game-card',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './card-data.component.html',
  styleUrls: ['./card-data.component.css'],
})
export class GameCard {
  data: CardData = {
    imageId: 'pDGNBK9A0sk',
    state: 'flipped',
  };

  cardClicked() {
    if (this.data.state === 'matched') return;
    this.data.state = this.data.state === 'default' ? 'flipped' : 'default';
  }
}
