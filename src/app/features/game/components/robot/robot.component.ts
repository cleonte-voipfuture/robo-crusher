import { Component, ElementRef, Input } from '@angular/core';
import { Robot } from '../../services/game-engine.service';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'robot',
  standalone: true,
  imports: [
    MatTooltip,
  ],
  templateUrl: './robot.component.html',
  styleUrl: './robot.component.sass'
})
export class RobotComponent {
  @Input() robot:Robot|undefined;

  constructor(private el: ElementRef) {}
}

