import {Physics} from 'phaser';
import {BulletData} from "../gameData/BulletData.ts";
import Bullet from "../entities/Bullet.ts";
import Entity from "../entities/Entity.ts";
import IComponent from "./IComponent.ts";

export default class Weapon implements IComponent {
    public enabled: boolean = true;

    private readonly _bullets: Physics.Arcade.Group;
    private readonly _bulletData: BulletData;
    private _spreadConfig?: {
        count: number;
        angleStartDeg: number;
        angleEndDeg: number;
    };


    constructor(bullets: Physics.Arcade.Group, bulletData: BulletData) {
        if (!bullets) {
            console.error("Weapon 'bullets' group cannot be null or undefined");
        }

        this._bullets = bullets;
        this._bulletData = bulletData;
    }

    public setSpread(count: number, angleStartDeg: number, angleEndDeg: number) {
        this._spreadConfig = { count, angleStartDeg, angleEndDeg };
    }


    public shoot(source: Entity) {
        if (!this.enabled)
            return;

        if (!this._bullets)
            return;

        const sourceForward: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0).rotate(source.rotation);

        if (this._spreadConfig) {
            const { count, angleStartDeg, angleEndDeg } = this._spreadConfig;
            const step = count > 1 ? (angleEndDeg - angleStartDeg) / (count - 1) : 0;

            for (let i = 0; i < count; i++) {
                const angleDeg = angleStartDeg + step * i;
                const angleRad = Phaser.Math.DegToRad(angleDeg);

                const dir = sourceForward.clone().rotate(angleRad);
                const vel = dir.clone().scale(this._bulletData.speed);

                const bullet: Bullet = this._bullets.get() as Bullet;
                if (!bullet) continue;

                bullet.enable(
                    source.x + dir.x * source.arcadeBody.radius,
                    source.y + dir.y * source.arcadeBody.radius,
                    vel.x,
                    vel.y,
                    this._bulletData
                );
            }

            return;
        }

        const bullet: Bullet = this._bullets.get() as Bullet;
        if (bullet) {
            const bulletVelocity: Phaser.Math.Vector2 = sourceForward.clone().scale(this._bulletData.speed);
            bullet.enable(
                source.x + sourceForward.x * source.arcadeBody.radius,
                source.y + sourceForward.y * source.arcadeBody.radius,
                bulletVelocity.x,
                bulletVelocity.y,
                this._bulletData
            );
        }
    }

}