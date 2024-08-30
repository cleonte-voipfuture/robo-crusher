import { ElementRef, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { UserSessionService } from '../../../core/services/user-session.service';
import SHA256 from 'crypto-js/sha256';
import Hex from 'crypto-js/enc-hex';
import { Animation, AnimatorService } from './animator.service';
import { AudioService } from './audio.service';
import { BehaviorSubject, Observable } from 'rxjs';

export type GridCell = {
  index: number,
  x: number,
  y: number,
  content?: GameObject|undefined,
}

export enum GameObjectCategory {
  Blocker = 'blocker',
  Robot = 'robot',
  PowerUp = 'power-up',
  Interactable = 'interactable',
}

export enum GameObjectType {
  Wall = 'wall',
  Crusher = 'crusher',
  PlayerRobot = 'player-robot',
  EnemyRobot = 'enemy-robot',
  Juice = 'juice',
  MegaJuice = 'mega-juice',
}

export enum Cardinal {
  North = 'N',
  East = 'E',
  South = 'S',
  West = 'W'
}

export enum Allegiance {
  Player = 'player',
  Enemy = 'enemy',
}

export enum RobotTag {
  Energized = 'energized', // Robot doesn't suffer energy losses.
}

export type Coords = [number, number];

export type CoordsOffsetByCardinal = {
  [key in Cardinal]: Coords
}

export const offsetsByCardinal:CoordsOffsetByCardinal = {
  [Cardinal.North]: [0, -1],
  [Cardinal.East]: [1, 0],
  [Cardinal.South]: [0, 1],
  [Cardinal.West]: [-1, 0],
}

export type GameObject = {
  id: string,
  category: GameObjectCategory,
  type: GameObjectType,
  cellIndex: number|undefined, // Index of grid cell where this object is placed (if any).
  description: string|undefined,
  destroyed: boolean,
}

export type Robot = GameObject & {
  category: GameObjectCategory.Robot,
  type: GameObjectType.PlayerRobot|GameObjectType.EnemyRobot,
  description: string,
  accessKey?: string,
  owner: string,
  power: number,
  allegiance: Allegiance,
  adjustPower: (powerCost: number|(()=>number)) => void,
  tags: Map<RobotTag, any>,
}

export type Wall = GameObject & {
  category: GameObjectCategory.Blocker,
  type: GameObjectType.Wall,
  description: 'Wall',
}

export type Crusher = GameObject & {
  category: GameObjectCategory.Interactable,
  type: GameObjectType.Crusher,
  description: 'Crusher',
}

export type Juice = GameObject & {
  category: GameObjectCategory.PowerUp,
  type: GameObjectType.Juice,
  description: 'Juice [3-5] Power',
}

export type MegaJuice = GameObject & {
  category: GameObjectCategory.PowerUp,
  type: GameObjectType.MegaJuice,
  description: 'MegaJuice [5-9] Power',
}

export enum RobotAction {
  Move = 'move',
  JumpEdge = 'jump-edge',
  Wait = 'wait',
  Brace = 'brace',
}

export enum RobotInteraction {
  Push = 'push',
  GetPushed = 'get-pushed',
  ConsumeJuice = 'consume-juice',
  ConsumeMegaJuice = 'consume-mega',
  DestroyEnemy = 'destroy-enemy',
  CrushEnemy = 'crush-enemy',
  FellInCrusher = 'fell-in-crusher',
}

export const powerCosts = (new Map())
  .set(RobotAction.Move, -1)
  .set(RobotAction.JumpEdge, 0)
  .set(RobotAction.Wait, -1)
  .set(RobotAction.Brace, -2)
  .set(RobotInteraction.Push, 1) // Draining energy from enemy.
  .set(RobotInteraction.GetPushed, -1)
  .set(RobotInteraction.ConsumeJuice, () => 3 + Math.round(2 * Math.random()))
  .set(RobotInteraction.ConsumeMegaJuice, () => 5 + Math.round(4 * Math.random()))
  .set(RobotInteraction.DestroyEnemy, 3)
  .set(RobotInteraction.CrushEnemy, 3)
  .set(RobotInteraction.FellInCrusher, 2)
;

export const isRobot = (object: GameObject|undefined): object is Robot => {
  return object !== undefined
    && (object.type === GameObjectType.PlayerRobot || object.type === GameObjectType.EnemyRobot);
}

export enum GameEventType {
  RobotDestroyed = 'robot-destroyed',
  GameOver = 'game-over',
  RobotCrushed = 'robot-crushed',
}

export type GameEvent = {
  type: GameEventType,
  payload?: any,
}

export type RobotDestroyedEvent = GameEvent & {
  type: RobotDestroyedEvent,
  payload: {
    robot: Robot,
  }
}

export type RobotCrushedEvent = GameEvent & {
  type: RobotCrushedEvent,
  payload: {
    robot: Robot,
  }
}

export const GameEventsQueue = {
  listeners: new Array<[(event: GameEvent) => void, GameEventType|'all']>(),
  subscribe: function(listener: (event: GameEvent) => void, eventType: GameEventType|'all') {
    const listenerTuple: [(event: GameEvent) => void, GameEventType|'all'] = [listener, eventType];
    for (let i= 0; i < this.listeners.length; i++) {
      if(this.listeners[i][1] === eventType && this.listeners[i][0] === listener) {
        return;
      }
    }
    this.listeners.push(listenerTuple);
  },
  dispatch: function(event: GameEvent) {
    for (let i = 0; i < this.listeners.length; i++) {
      const type = this.listeners[i][1];
      if (type === 'all' || event.type === type) {
        console.info(`Dispatching '${type}' event, to registered listener #${i}.`, event);
        this.listeners[i][0](event);
      }
    }
  },
}

@Injectable({
  providedIn: 'root'
})
export class GameEngineService {
  private readonly defaultRobotPower= 9;
  private gridData = {
    colCount: 0,
    rowCount: 0,
    cellCount: 0,
    cells: new Array<GridCell>(),
  };
  private gridDataSubject = new BehaviorSubject(this.gridData);
  private introPlayPressure = 66;
  private inputLock = false;
  private isGameRunning = false;
  private isCountingDown = false;
  private enemyLifeBonus = -6;
  private enemyKills = 0;
  private lastPlayerRobot: Robot|undefined;
  private level = 1; // Current game level.
  private renderer: Renderer2;
  private delays = new Array<number>();

  constructor(
    private sessionService: UserSessionService,
    private animatorService: AnimatorService,
    private audioService: AudioService,
    rendererFactory: RendererFactory2,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    GameEventsQueue.subscribe(this.onRobotDestroyedHandler.bind(this), GameEventType.RobotDestroyed);
    GameEventsQueue.subscribe(this.onGameOver.bind(this), GameEventType.GameOver);
    GameEventsQueue.subscribe(this.onRobotCrushed.bind(this), GameEventType.RobotCrushed);
  }

  getGridData() {
    return this.gridDataSubject.asObservable();
  }

  startGame(): Robot {
    this.generateRandomMap();
    if (this.countEnemyRobots() < 1) {
      this.spawnEnemyRobot('Dudu Prime');
    }
    this.musicBuildPressure();
    const playerRobot = this.spawnPlayerRobot(
      this.sessionService.username(),
      this.sessionService.authKey(),
    );
    this.pushGameState();
    this.isGameRunning = true;
    this.isCountingDown = false;
    this.unlockInput();
    return playerRobot;
  }

  spawnEnemyRobot(robotName: string, enemyName: string = 'El Computer'): void {
    const thisParent = this;
    const robot: Robot = {
      id: this.newObjectId(),
      power: this.defaultRobotPower + this.enemyLifeBonus,
      cellIndex: undefined,
      category: GameObjectCategory.Robot,
      type: GameObjectType.EnemyRobot,
      owner: enemyName,
      description: `\`${robotName}\` ${enemyName}'s Robot`,
      allegiance: Allegiance.Enemy,
      adjustPower: (powerCost: number|(()=>number)) => thisParent.robotAdjustPowerMethod(powerCost, robot),
      destroyed: false,
      tags: new Map(),
    };
    this.safeTryRepeat(() => this.tryPlaceObjectOnGridAtCoords(robot, this.randomCoords()));
    this.audioService.playEnemyRobotSpawn();
  }

  spawnPlayerRobot(playerName: string, playerAccessKey: string): Robot {
    const thisParent = this;
    const id = this.newObjectId();
    const robot: Robot = {
      id,
      accessKey: this.accessKeyFromIdAndPlayerAccessKey(id, playerAccessKey),
      power: this.defaultRobotPower,
      cellIndex: undefined,
      category: GameObjectCategory.Robot,
      type: GameObjectType.PlayerRobot,
      owner: playerName,
      description: `${playerName}'s Robot`,
      allegiance: Allegiance.Player,
      adjustPower: (powerCost: number|(()=>number)) => thisParent.robotAdjustPowerMethod(powerCost, robot),
      destroyed: false,
      tags: new Map(),
    };
    this.safeTryRepeat(() => this.tryPlaceObjectOnGridAtCoords(robot, this.randomCoords()));
    this.lastPlayerRobot = robot;
    return robot;
  }

  countPlayerRobots(): number {
    let count = 0;
    for(let i = 0; i < this.gridData.cellCount; i++) {
      const content = this.gridData.cells[i].content;
      if (content && isRobot(content) && content.type === GameObjectType.PlayerRobot) {
        count ++
      }
    }
    return count;
  }

  countEnemyRobots(): number {
    let count = 0;
    for(let i = 0; i < this.gridData.cellCount; i++) {
      const content = this.gridData.cells[i].content;
      if (content && isRobot(content) && content.type === GameObjectType.EnemyRobot) {
        count ++
      }
    }
    return count;
  }

  initRobotMove(robot: Robot, direction: Cardinal): void {
    if (this.inputLock) return;
    this.lockInput();
    if (robot.cellIndex === undefined) return this.unlockInput();
    const targetCellIndex = this.cellIndexFromCoordsAndDirection(
      this.coordsFromIndex(robot.cellIndex), direction
    );
    // Case 1: target cell is on the other side of an edge => allow jump if not blocked (pushing not allowed)
    if (targetCellIndex === null) {
      // This is a jump, ignoring animations, cannot push.
      if (this.directMoveObjectInDirection(robot, direction)) {
        this.audioService.playRobotJump();
        robot.adjustPower(powerCosts.get(RobotAction.JumpEdge));
        return this.unlockInput();
      } else {
        // Could not move because position was occupied and jumping doesn't allow pushing.
        this.audioService.playRejectionSound();
      }
    } else {
      const targetCellOccupant = this.gridData.cells[targetCellIndex].content;
      // Case 2: target cell is empty => move robot to it
      if (!targetCellOccupant) {
        this.handleMoveToEmpty(robot, targetCellIndex);
        return;
        // Case 3: target cell is enemy robot
      } else if (isRobot(targetCellOccupant) && targetCellOccupant.type === GameObjectType.EnemyRobot) {
        // Get coords of cell directly behind target, along the direction of the push (including edge-jumping).
        const pushTargetCellIndex = this.cellIndexFromCoordsAndDirection(
          this.coordsFromIndex(targetCellIndex), direction, true
        ) as number;
        const pushTargetCellContent = this.gridData.cells[pushTargetCellIndex].content;
        if (!pushTargetCellContent || pushTargetCellContent.type == GameObjectType.Crusher) {
          const intoCrusher = pushTargetCellContent?.type == GameObjectType.Crusher
          // Location behind enemy is empty or crusher, so the enemy will be pushed.
          this.delayed(() => this.audioService.playRobotPushed(), 0.5);
          Promise.all([
            this.animatorService
              .prepRobotMoveAnimation(
                this.getElementByGameObject(robot),
                this.getElementByCellIndex(targetCellIndex),
              ).play(),
            this.animatorService
              .prepRobotMoveAnimation(
                this.getElementByGameObject(targetCellOccupant),
                this.getElementByCellIndex(pushTargetCellIndex),
              ).play(0.05),
          ]).then(() => {
              // Move enemy first to make room for the pusher to come in.
              this.delayed(() => {
                if (this.tryPlaceObjectOnGridAtCoords(targetCellOccupant, this.coordsFromIndex(pushTargetCellIndex), intoCrusher)) {
                  if (intoCrusher) {
                    GameEventsQueue.dispatch({
                      type: GameEventType.RobotCrushed,
                      payload: { robot: targetCellOccupant },
                    });
                  } else {
                    targetCellOccupant.adjustPower(powerCosts.get(RobotInteraction.GetPushed));
                    robot.adjustPower(powerCosts.get(RobotInteraction.Push));
                  }
                }
              });
              // Very important to defer this one for angular to finish cleaning up the destination cell element
              // affected above. There was a strange bug with the DOM element transform getting stuck.
              this.delayed(() => {
                if (this.tryPlaceObjectOnGridAtCoords(robot, this.coordsFromIndex(targetCellIndex))) {
                  robot.adjustPower(powerCosts.get(RobotAction.Move));
                }
                return this.unlockInput();
              });
          })
          return;
        } else {
          // Location behind is blocked, this push turns into a failed move (move cost charged, not push cost).
          this.audioService.playRejectionSound();
        }
      // Case 4: target cell is crusher (when not in countdown)
      } else if (targetCellOccupant.type === GameObjectType.Crusher && !this.isCountingDown) {
        this.handleMoveToCrusher(robot, targetCellIndex)
          .then(() => {
            GameEventsQueue.dispatch({
              type: GameEventType.RobotCrushed,
              payload: { robot },
            });
          });
        return;
      } else {
        // Cannot move here.
        this.audioService.playRejectionSound();
      }
    }
    this.unlockInput();
  }

  private musicBuildPressure() {
    this.introPlayPressure += Math.floor(33 * Math.random());
    if (this.introPlayPressure > 100) {
      this.audioService.playTrack8BitLoopIntro();
      this.introPlayPressure = 0;
    }
  }

  private detachAndGetAllRobots(): Robot[] {
    const robots = new Array<Robot>();
    for(let i = 0; i < this.gridData.cellCount; i++) {
      const content = this.gridData.cells[i].content;
      if (content && isRobot(content) && content.category === GameObjectCategory.Robot) {
        this.detachObject(content);
        content.cellIndex = undefined;
        robots.push(content);
      }
    }
    return robots;
  }

  private sprinkleRobots(robots: Robot[]): void {
    for (let i = robots.length - 1; i >= 0; i--) {
      this.safeTryRepeat(() => this.tryPlaceObjectOnGridAtCoords(robots[i], this.randomCoords()));
    }
  }

  private robotAdjustPowerMethod(powerCost: number|(()=>number), robot: Robot): void {
    const appliedCost = (typeof powerCost === 'function') ? powerCost() : powerCost;
    if(appliedCost < 0 && robot.tags.get(RobotTag.Energized)) return;
    robot.power += appliedCost;
    if (robot.power <= 0) {
      GameEventsQueue.dispatch({
       type: GameEventType.RobotDestroyed,
       payload: { robot },
      });
    }
  }

  private getRobotTags(robot: Robot) {
    return Array.from(robot.tags.keys());
  }

  private pushGameState(): void {
    this.gridDataSubject.next(this.gridData);
  }

  private generateRandomMap() {
    const grid: GridCell[] = [];
    [this.gridData.colCount, this.gridData.rowCount] = this.pickRandomMapSize(10, 10, 10);
    this.gridData.cellCount = this.gridData.colCount * this.gridData.rowCount;
    this.gridData.cells = new Array(this.gridData.cellCount);
    for (let index = 0; index < this.gridData.cellCount; index ++) {
      const [x, y] = this.coordsFromIndex(index);
      grid.push({index, x, y });
    }
    this.gridData.cells = grid;
    this.spawnWalls(3, Math.max(3, Math.round(this.gridData.cellCount * 0.2)));
    this.spawnCrusher();
  }

  private enemyDestroyed() {
    this.enemyLifeBonus ++;
    this.enemyKills ++;
    if (this.lastPlayerRobot) {
      this.lastPlayerRobot.tags.set(RobotTag.Energized, true);
      this.lastPlayerRobot.adjustPower(powerCosts.get(RobotInteraction.DestroyEnemy));
    }
    this.audioService.playExplosion();
  }

  private onRobotDestroyedHandler(event: GameEvent): void {
    console.info('Robot destroyed!');
    const robot = (event as RobotDestroyedEvent).payload.robot;
    robot.destroyed = true;
    this.detachObject(robot);
    if (robot.type === GameObjectType.PlayerRobot) {
      this.lastPlayerRobot = undefined;
      return GameEventsQueue.dispatch({
        type: GameEventType.GameOver,
      });
    } else {
      this.enemyDestroyed();
      this.isCountingDown = true;
      this.delayed(() => this.audioService.playCountdown(), 1000);
      this.delayed(() => {
        this.lastPlayerRobot?.tags.delete(RobotTag.Energized);
        if (this.isGameRunning) {
          this.lockInput();
          const robots = this.detachAndGetAllRobots();
          this.generateRandomMap();
          this.sprinkleRobots(robots);
          this.spawnEnemyRobot(`Dudu v${this.enemyKills + 1}`);
          this.pushGameState();
          this.unlockInput();
          this.musicBuildPressure();
          this.isCountingDown = false;
          this.level ++;
        }
      }, 4700);
    }
  }

  private onGameOver(): void {
    console.info('Game Over');
    this.clearAllDelayed();
    this.audioService.playPlayerRobotDestroyed();
    this.endGame();
  }

  private onRobotCrushed(event: GameEvent): void {
    console.info('Robot Crushed!');
    const robot = (event as RobotCrushedEvent).payload.robot;
    if (robot.type === GameObjectType.PlayerRobot) {
      this.lastPlayerRobot?.adjustPower(powerCosts.get(RobotInteraction.FellInCrusher));
      this.delayed(() => {
        this.lastPlayerRobot?.tags.delete(RobotTag.Energized);
        if (this.isGameRunning) {
          this.lockInput();
          const robots = this.detachAndGetAllRobots();
          this.generateRandomMap();
          this.sprinkleRobots(robots);
          if (this.countEnemyRobots() < 1) {
            this.spawnEnemyRobot(`Dudu v${this.enemyKills + 1}`);
          }
          this.pushGameState();
          this.unlockInput();
          this.level ++;
        }
      });
    } else if (robot.type === GameObjectType.EnemyRobot) {
      this.enemyDestroyed();
      robot.adjustPower(0);
      this.detachObject(robot);
      this.lastPlayerRobot?.adjustPower(powerCosts.get(RobotInteraction.CrushEnemy) + parseInt(robot.power));
      this.delayed(() => {
        this.lastPlayerRobot?.tags.delete(RobotTag.Energized);
        if (this.isGameRunning) {
          this.lockInput();
          const robots = this.detachAndGetAllRobots();
          this.generateRandomMap();
          this.sprinkleRobots(robots);
          if (this.countEnemyRobots() < 1) {
            this.spawnEnemyRobot(`Dudu v${this.enemyKills + 1}`);
          }
          this.pushGameState();
          this.unlockInput();
          this.level ++;
        }
      }, 1000);
    }
  }

  private endGame() {
    this.inputLock = true;
    this.isGameRunning = false;
    this.isCountingDown = false
  }

  private lockInput() {
    this.inputLock = true;
  }

  private unlockInput() {
    if (this.isGameRunning) {
      this.inputLock = false;
    }
  }

  private getElementByGameObject(object: GameObject) {
    const element = this.renderer
      .selectRootElement(`#${object.category}-${object.id}`, true);
    if (!element) throw new Error(`Could not find corresponding element for object #'${object.id}'.`);
    return new ElementRef(element.parentElement);
  }

  private getElementByCellIndex(index: number) {
    const element = this.renderer
      .selectRootElement(`.grid-map > .cell#grid-cell-${index}`, true);
    if (!element) throw new Error(`Could not find corresponding element for cell index #'${index}'.`);
    return new ElementRef(element);
  }

  private pickRandomMapSize(minVolume: number, maxWidth: number, maxHeight: number): Coords {
    return this.safeTryRepeat(() => {
      const size = [
        Math.max(4, Math.round(maxWidth * Math.random())),
        Math.max(4, Math.round(maxHeight * Math.random())),
      ];
      return size[0] * size[1] > minVolume ? size as Coords : undefined;
    });
  }

  private accessKeyFromIdAndPlayerAccessKey(id: string, playerAccessKey: string): string {
    return SHA256(`${id}/${playerAccessKey}`).toString(Hex);
  }

  private spawnWalls(minCount: number, maxCount: number): void {
    const wallCount = minCount + Math.round(Math.random() * (maxCount - minCount));
    for (let i = 0; i < wallCount; i++) {
      const wall: Wall = {
        id: this.newObjectId(),
        cellIndex: undefined,
        category: GameObjectCategory.Blocker,
        type: GameObjectType.Wall,
        description: 'Wall',
        destroyed: false,
      };
      this.safeTryRepeat(() => this.tryPlaceObjectOnGridAtCoords(wall, this.randomCoords()));
    }
  }

  private spawnCrusher(): void {
    const crusher: Crusher = {
      id: this.newObjectId(),
      cellIndex: undefined,
      category: GameObjectCategory.Interactable,
      type: GameObjectType.Crusher,
      description: 'Crusher',
      destroyed: false,
    };
    this.safeTryRepeat(() => this.tryPlaceObjectOnGridAtCoords(crusher, this.randomCoords()));
  }

  private safeTryRepeat(fn: CallableFunction, tryCount= 100): any {
    while(tryCount > 0) {
      const out = fn();
      if (out !== undefined && out !== null && out !== false) {
        return out;
      }
      tryCount --;
    }
    throw new Error('Try repeat timeout.');
  }

  private tryPlaceObjectOnGridAtCoords(object: GameObject, coords: Coords, displaceExisting = false): boolean {
    const cellIndex = this.indexFromCoords(coords);
    if (cellIndex < 0) return false;
    const objectAtCoords = this.gridData.cells[cellIndex].content;
    if (objectAtCoords) {
      if (displaceExisting) {
        this.detachObject(objectAtCoords);
      } else {
        return objectAtCoords.id === object.id; // Consider placed if already there, reject if something else.
      }
    }
    this.detachObject(object);
    object.cellIndex = cellIndex;
    this.gridData.cells[cellIndex].content = object;
    return true;
  }

  private directMoveObjectInDirection(object: GameObject, direction: Cardinal): boolean {
    if (object.cellIndex !== undefined && this.gridData.cells[object.cellIndex]?.content) {
      const [x, y] = this.coordsFromIndex(object.cellIndex);
      const [xOffset, yOffset] = offsetsByCardinal[direction];
      let [targetX, targetY] = [x + xOffset, y + yOffset];
      // Allow grid edge-jump.
      targetX = targetX < 0 ? this.gridData.colCount - 1 : targetX >= this.gridData.colCount ? 0 : targetX;
      targetY = targetY < 0 ? this.gridData.rowCount - 1 : targetY >= this.gridData.rowCount ? 0 : targetY;
      const targetIndex = this.indexFromCoords([targetX, targetY]);
      if (targetIndex >= 0 && targetIndex < this.gridData.cellCount) {
        return this.tryPlaceObjectOnGridAtCoords(object, this.coordsFromIndex(targetIndex));
      }
    }
    return false;
  }

  private cellIndexFromCoordsAndDirection(coords: Coords, direction: Cardinal, allowEdgeJump = false): number|null {
    const [x, y] = coords;
    const [xOffset, yOffset] = offsetsByCardinal[direction];
    let [xTarget, yTarget] = [x + xOffset, y + yOffset];
    // Calculate with grid edge-jump.
    xTarget = xTarget < 0 ? this.gridData.colCount - 1 : xTarget >= this.gridData.colCount ? 0 : xTarget;
    yTarget = yTarget < 0 ? this.gridData.rowCount - 1 : yTarget >= this.gridData.rowCount ? 0 : yTarget;
    // Return null if edge-jump detected but not allowed.
    return (!allowEdgeJump && (x + xOffset !== xTarget || y + yOffset !== yTarget)) ? null
      : this.indexFromCoords([xTarget, yTarget]);
  }

  private detachObject(object: GameObject): void {
    if (object.cellIndex !== undefined) {
      this.gridData.cells[object.cellIndex].content = undefined;
    }
  }

  private randomCoords(): Coords {
    return this.coordsFromIndex(Math.round(Math.random() * (this.gridData.cellCount - 1)));
  }

  private indexFromCoords(coords: Coords): number {
    return (coords[0] >= 0 && coords[1] >= 0)
      ? this.gridData.colCount * coords[1] + coords[0]
      : -1;
  }

  private coordsFromIndex(index: number): Coords {
    return [index % this.gridData.colCount, Math.floor(index / this.gridData.colCount)];
  }

  private newObjectId(): string {
    return uuidv4();
  }

  private handleMoveToEmpty(robot: Robot, targetCellIndex: number) {
    this.audioService.playRobotMoves();
    this.animatorService
      .prepRobotMoveAnimation(this.getElementByGameObject(robot), this.getElementByCellIndex(targetCellIndex))
      .play().then(() => {
        if (this.tryPlaceObjectOnGridAtCoords(robot, this.coordsFromIndex(targetCellIndex))) {
          robot.adjustPower(powerCosts.get(RobotAction.Move));
        }
        this.unlockInput();
      });
  }

  private handleMoveToCrusher(robot: Robot, targetCellIndex: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.audioService.playRobotJumpsInCrusher();
      this.animatorService
        .prepRobotFallInCrusherAnimation(this.getElementByGameObject(robot), this.getElementByCellIndex(targetCellIndex))
        .play().then(() => {
          if (this.tryPlaceObjectOnGridAtCoords(robot, this.coordsFromIndex(targetCellIndex), true)) {
            robot.adjustPower(powerCosts.get(RobotAction.Move));
          }
          this.unlockInput();
          resolve();
        });
    });
  }

  private delayed(action: ()=>void, delay = 0) {
    let availableIndex = -1;
    for (let i = 0; i < this.delays.length; i ++) {
      if (!this.delays[i]) {
        availableIndex = i;
        break;
      }
    }
    if (availableIndex < 0) {
      availableIndex = this.delays.length;
    }
    this.delays[availableIndex] = setTimeout(() => {
      this.delays[availableIndex] = 0;
      action();
    }, delay);
    return availableIndex;
  }

  private clearDelayed(index: number) {
    if (this.delays[index]) {
      this.delays[index] = 0;
      clearTimeout(this.delays[index])
    }
  }

  private clearAllDelayed() {
    for (let i = 0; i < this.delays.length; i ++) {
      if (this.delays[i]) {
        clearTimeout(this.delays[i]);
        this.delays[i] = 0;
      }
    }
  }
}
