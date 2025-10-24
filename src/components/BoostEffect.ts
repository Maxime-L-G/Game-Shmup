import Player from "../entities/Player";
import Health from "./Health";
import Movement from "./Movement";

export interface IBoostEffect {
  readonly texture: string;
  apply(player: Player): void;
}

export class HealEffect implements IBoostEffect {
  readonly texture = 'pill_red.png';
  constructor(private amount: number = 1) {}
  apply(player: Player) {
      player.getComponent(Health)?.heal(this.amount);
  }
}

export class SpeedBoostEffect implements IBoostEffect {
  readonly texture = 'pill_blue.png';
  constructor(private multiplier = 1.5, private duration = 5000) {}

  apply(player: Player) {
    const movement = player.getComponent(Movement) as Movement;

    if (movement) {
      const currentSpeed = movement.speed;
      movement.setSpeed(currentSpeed * this.multiplier);

      const scene = player.scene as any;
      scene.tweens.add({
        targets: scene,
        bgSpeed: 5,
        duration: 2000,
        ease: 'Sine.easeOut',
      })

      player.showSpeedEffect(this.duration);

      player.scene.time.delayedCall(this.duration, () => {
      movement.setSpeed(currentSpeed);
      player.hideSpeedEffect();
      scene.tweens.add({
        targets: scene,
        bgSpeed: 1,
        duration: 1000,
        ease: 'Sine.easeIn',
      })
    })
    }

    
  }
}