import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Wall } from '../../services/game-engine.service';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'wall',
  standalone: true,
  imports: [
    NgStyle,
    MatTooltip
  ],
  templateUrl: './wall.component.html',
  styleUrl: './wall.component.sass'
})
export class WallComponent {
  @Input() wall:Wall|undefined;
}
