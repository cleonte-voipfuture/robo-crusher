import { Component, OnDestroy, OnInit, ViewEncapsulation, } from '@angular/core';
import { MatTabLink } from '@angular/material/tabs';
import { RouterLinkActive } from '@angular/router';
import {
  Crusher,
  GameEngineService,
  GameObjectCategory,
  GameObjectType,
  GridCell,
  Robot,
  Wall
} from '../../services/game-engine.service';
import { NgStyle, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { WallComponent } from '../wall/wall.component';
import { CrusherComponent } from '../crusher/crusher.component';
import { RobotComponent } from '../robot/robot.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-grid-map',
  standalone: true,
  imports: [
    MatTabLink,
    RouterLinkActive,
    NgSwitch,
    NgSwitchDefault,
    NgSwitchCase,
    WallComponent,
    CrusherComponent,
    NgStyle,
    RobotComponent,
  ],
  templateUrl: './grid-map.component.html',
  styleUrl: './grid-map.component.sass',
  encapsulation: ViewEncapsulation.None
})
export class GridMapComponent implements OnInit, OnDestroy {
  public cells = new Array<GridCell>();
  private gridDataSubscription: Subscription|undefined;

  public cellCount!: number;
  public gridWidthInUnits!: number;
  public cellSizeInUnits = 10;
  public scaleFactor = 0.35;
  cellSizeInUnitsScaled = this.cellSizeInUnits * this.scaleFactor;
  protected readonly gameObjectType = GameObjectType;

  constructor(private gameEngine: GameEngineService) {}

  ngOnInit(): void {
    this.gridDataSubscription = this.gameEngine.getGridData().subscribe(
      gridData => {
        this.cellCount = gridData.cellCount;
        this.gridWidthInUnits = this.cellSizeInUnits * gridData.colCount;
        this.cells = gridData.cells;
      }
    );
  }

  ngOnDestroy() {
    this.gridDataSubscription?.unsubscribe();
  }

  wallFromCell(cell : GridCell): Wall {
    if (cell.content?.type === GameObjectType.Wall) {
      return cell.content as Wall;
    }
    throw new Error('Cell does not contain Wall object.')
  }

  crusherFromCell(cell : GridCell): Crusher {
    if (cell.content?.type === GameObjectType.Crusher) {
      return cell.content as Crusher;
    }
    throw new Error('Cell does not contain Crusher object.')
  }

  robotFromCell(cell : GridCell): Robot {
    if (cell.content?.category === GameObjectCategory.Robot) {
      return cell.content as Robot;
    }
    throw new Error('Cell does not contain Robot object.')
  }
}
