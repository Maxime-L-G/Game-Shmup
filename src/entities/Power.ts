import Entity from "./Entity";
import Movement from "../components/Movement";
import { IBoostEffect } from "../components/BoostEffect";
import Player from "./Player";

export default class Power extends Entity {
  private _boostEffect: IBoostEffect;

  public setEffect(effect: IBoostEffect): this{
    this._boostEffect = effect;
    this.setTexture('sprites', effect.texture);
    return this;
  }

  public init() {
    this.addComponent(new Movement(0.4));

    this.angle = 90;
    this.setScale(2.5);
  }

  public applyBoostEffect(player: Player) {
    if (this._boostEffect) {
        this._boostEffect.apply(player);
    }
    this.disable();
  }

  public enable (x: number, y: number) {
    this.enableBody(true, x, y -this.displayHeight, true, true);
    if (this.body) {
        this.body.setSize(16, 16);
    }
  }

  public disable() {
    this.disableBody(true, true);
  }

  preUpdate(timeSinceLaunch: number, deltaTime: number) {
      super.preUpdate(timeSinceLaunch, deltaTime);

      if (this.y > this.scene.cameras.main.height + this.displayHeight) {
            this.disable();
      }

      if (!this.isTinted)
          this.getComponent(Movement)?.moveVertically(this, deltaTime);
      else
          this.getComponent(Movement)?.moveVertically(this, deltaTime * 0.5);
  }
}