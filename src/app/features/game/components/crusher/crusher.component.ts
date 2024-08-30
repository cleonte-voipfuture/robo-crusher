import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Crusher } from '../../services/game-engine.service';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'crusher',
  standalone: true,
  imports: [
    NgStyle,
    MatTooltip
  ],
  templateUrl: './crusher.component.html',
  styleUrl: './crusher.component.sass'
})
export class CrusherComponent {
  @Input() crusher:Crusher|undefined;
}
