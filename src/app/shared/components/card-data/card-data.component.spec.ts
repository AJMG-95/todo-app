import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCard } from './card-data.component';

describe('GameCard', () => {
  let component: GameCard;
  let fixture: ComponentFixture<GameCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
