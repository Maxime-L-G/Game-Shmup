import Entity from "./Entity";
import Movement from "../components/Movement";

export default class Power extends Entity {


  public init() {
    this.addComponent(new Movement(0.4));

    this.angle = 90;
    this.setScale(2.5);
  }

  public enable (x: number, y: number) {
    this.enableBody(true, x, y -this.displayHeight, true, true);
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