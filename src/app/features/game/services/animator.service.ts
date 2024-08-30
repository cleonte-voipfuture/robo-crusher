import { ElementRef, Injectable } from '@angular/core';
import { Coords } from './game-engine.service';
import { gsap } from 'gsap';

export interface Animation {
  id: number,
  play(delaySeconds?: number): Promise<Animation>,
}

@Injectable({
  providedIn: 'root'
})
export class AnimatorService {
  animations: (Animation|null)[] = [];
  animationsIndex: Map<number, number> = new Map();
  animationAutoId: number = 0;

  private getEmptySlotIndex(): number {
    for (let i = 0; i < this.animations.length; i++) {
      if (!this.animations[i]) {
        return i;
      }
    }
    this.animations.push(null);
    return this.animations.length - 1;
  };

  private pushToEmptySlot(animation: Animation): number {
    const index = this.getEmptySlotIndex();
    this.animations[index] = animation;
    return index;
  }

  private clearSlot(slotIndex: number): void {
    const animation = this.animations[slotIndex];
    if (animation) {
      this.animationsIndex.delete(animation.id);
      this.animations[slotIndex] = null;
    }
  }

  getUnitOffsetBetweenTwoGridCells(fromElement: ElementRef, toElement: ElementRef): Coords {
    const from = fromElement.nativeElement.getBoundingClientRect();
    const to = toElement.nativeElement.getBoundingClientRect();
    return [to.x - from.x, to.y - from.y];
  }

  prepRobotMoveAnimation(robotElement: ElementRef, toCellElement: ElementRef): Animation {
    if (!(robotElement?.nativeElement && toCellElement?.nativeElement)) throw new Error('Missing native element.');
    const fromCellElement = new ElementRef(robotElement.nativeElement.parentElement);
    const id = ++this.animationAutoId;
    const animation: Animation = {
      id,
      play: (delay?: number) => new Promise<Animation>((resolve) => {
        const unitOffset = this.getUnitOffsetBetweenTwoGridCells(fromCellElement, toCellElement) as Coords;
        gsap.to(robotElement.nativeElement.firstChild, {
          delay,
          duration: 0.16,
          x: unitOffset[0],
          y: unitOffset[1],
          ease: 'power4.inOut',
          onComplete: () => {
            const slotIndex = this.animationsIndex.get(id);
            if (slotIndex !== undefined) {
              this.clearSlot(slotIndex);
            }
            resolve(animation);
          }
        });
      }),
    };
    const slotIndex = this.pushToEmptySlot(animation);
    this.animationsIndex.set(animation.id, slotIndex);
    return animation;
  }

  prepRobotFallInCrusherAnimation(robotElement: ElementRef, toCellElement: ElementRef): Animation {
    if (!(robotElement?.nativeElement && toCellElement?.nativeElement)) throw new Error('Missing native element.');
    const fromCellElement = new ElementRef(robotElement.nativeElement.parentElement);
    const id = ++this.animationAutoId;
    const animation: Animation = {
      id,
      play: (delay?: number) => new Promise<Animation>((resolve) => {
        const unitOffset = this.getUnitOffsetBetweenTwoGridCells(fromCellElement, toCellElement) as Coords;
        gsap.to(robotElement.nativeElement.firstChild, {
          delay,
          duration: 0.16,
          x: unitOffset[0],
          y: unitOffset[1],
          scale: 0.5,
          opacity: 0,
          ease: 'power4.inOut',
          onComplete: () => {
            const slotIndex = this.animationsIndex.get(id);
            if (slotIndex !== undefined) {
              this.clearSlot(slotIndex);
            }
            resolve(animation);
          }
        });
      }),
    };
    const slotIndex = this.pushToEmptySlot(animation);
    this.animationsIndex.set(animation.id, slotIndex);
    return animation;
  }
}
