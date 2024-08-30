import { Component, HostListener } from '@angular/core';
import { UserSessionService } from '../../services/user-session.service';
import { GridMapComponent } from '../../../features/game/components/grid-map/grid-map.component';
import { FlexModule } from '@angular/flex-layout';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Cardinal, GameEngineService, Robot } from '../../../features/game/services/game-engine.service';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [GridMapComponent, FlexModule, MatButton, MatIconButton, MatIcon, MatTooltip],
  templateUrl: './play.component.html',
  styleUrl: './play.component.sass'
})
export class PlayComponent {
  directionByKey: Map<string, Cardinal> = (new Map())
    .set('ArrowUp', Cardinal.North)
    .set('ArrowRight', Cardinal.East)
    .set('ArrowDown', Cardinal.South)
    .set('ArrowLeft', Cardinal.West)
    .set('w', Cardinal.North)
    .set('d', Cardinal.East)
    .set('s', Cardinal.South)
    .set('a', Cardinal.West);
  playerRobot: Robot|undefined;

  constructor(
    private sessionService: UserSessionService,
    public gameEngine: GameEngineService,
  ) {}

  startGame(): void {
    this.playerRobot = this.gameEngine.startGame();
  }

  moveSelf(direction: Cardinal): void {
    if (this.playerRobot) {
      this.gameEngine.initRobotMove(this.playerRobot, direction);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const direction = this.directionByKey.get(event.key);
    if (direction) {
      event.preventDefault();
      event.stopPropagation();
      this.moveSelf(direction);
    }
  }

  protected readonly Cardinal = Cardinal;
}
