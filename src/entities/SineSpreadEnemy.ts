import { Scene } from "phaser";
import Entity from "./Entity";
import Health from "../components/Health";
import Movement from "../components/Movement";
import Weapon from "../components/Weapon";
import type { BulletData } from "../gameData/BulletData";

export default class SineSpreadEnemy extends Entity {
  private _config: any;
  private _weapon: Weapon;
  private _t = 0;
  private _startX = 0;
  private _shootTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Scene, x: number, y: number, configKey: string) {
    super(scene, x, y, "sprites");

    const enemies = this.scene.cache.json.get("enemies") as Record<string, any>;
    this._config = enemies?.[configKey] ?? null;

    const texture = this._config?.texture ?? "enemyBlack1.png";
    this.setTexture("sprites", texture);

    const hp = this._config?.hp ?? 3;
    this.addComponent(new Health(hp, this));
    this.addComponent(new Movement(0.2));

    const health = this.getComponent(Health);
    health?.on(Health.CHANGE_EVENT, () => {
      this.setTintFill(0xffffff);

      if (health.current === 0) {
        this.disableBody();
      }

      this.scene.time.delayedCall(50, () => {
        this.clearTint();
        if (health.current === 0) {
          this.destroy();
        }
      });
    });

    const enemyBullets = (this.scene as any).enemyBullets as Phaser.Physics.Arcade.Group;
    const bulletData: BulletData = {
      width: 12,
      height: 12,
      color: this._config?.weapon?.bulletTint ?? 0xf25f5c,
      speed: this._config?.weapon?.bulletSpeed ?? 250,
      damage: 1,
    };

    this._weapon = new Weapon(enemyBullets, bulletData);
    this.addComponent(this._weapon);

    const w = this._config?.weapon;
    if (w?.type === "spread") {
      this._weapon.setSpread(w.count ?? 3, w.angleStart ?? -15, w.angleEnd ?? 15);
    }

    const rof = (w?.rateOfFire ?? 1.5) * 1000;
    this._shootTimer = this.scene.time.addEvent({
      delay: rof,
      loop: true,
      callback: () => {
        if (!this.active || !this.scene) return;

        this._weapon.shoot(this);
        if (this.scene.sound) this.scene.sound.play("sfx_laser2");
      },
    });

    this.angle = 90;
    this._startX = x;
    this.arcadeBody.setCircle(this.displayWidth / 2);
  }

  preUpdate(time: number, dt: number) {
    super.preUpdate(time, dt);

    this._t += dt / 1000;
    const amp = this._config?.movement?.amplitude ?? 120;
    const freq = this._config?.movement?.frequency ?? 2;
    const fallSpeed = this._config?.speed ?? 80;

    this.y += fallSpeed * (dt / 1000);
    this.x = this._startX + Math.sin(this._t * freq) * amp;

    if (this.y > this.scene.cameras.main.height + this.displayHeight) {
      this.destroy();
    }
  }

  public destroy(fromScene?: boolean): void {
    if (this._shootTimer) {
      this._shootTimer.remove();
      this._shootTimer = undefined;
    }
    super.destroy(fromScene);
  }
}
