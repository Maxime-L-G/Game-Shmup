import {Input, Scene} from "phaser";
import {PlayerShipData, PlayerShipsData} from "../gameData/PlayerShipsData.ts";
import type {BulletData} from "../gameData/BulletData.ts";
import Entity from './Entity.ts';
import Health from "../components/Health.ts";
import Movement from "../components/Movement.ts";
import Weapon from "../components/Weapon.ts";

export default class Player extends Entity {
    private readonly _bulletData: BulletData = {
        width: 12,
        height: 4,
        color: 0xffe066,
        speed: 1024,
        damage: 1
    };

    private readonly _cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    private _playerShipData: PlayerShipData;
    private _rateOfFire: number;
    private _lastShotTime: number;
    private _leftSpeedEffect: Phaser.GameObjects.Sprite;
    private _rightSpeedEffect: Phaser.GameObjects.Sprite;
    private _speedEffectTween: Phaser.Tweens.Tween;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'sprites');

        if (this.scene.input.keyboard) {
            this._cursorKeys = this.scene.input.keyboard.createCursorKeys();

            this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.ONE).on('down', () => this.selectPlayerShip(1));
            this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.TWO).on('down', () => this.selectPlayerShip(2));
            this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.THREE).on('down', () => this.selectPlayerShip(3));
        }
    }

    public init(bulletsGroup: Phaser.Physics.Arcade.Group) {
        this.addComponent(new Health(3, this));
        this.addComponent(new Movement());
        this.addComponent(new Weapon(bulletsGroup, this._bulletData));

        this.angle = -90;

        this.selectPlayerShip(1);

        this._rateOfFire = 0.5;
        this._lastShotTime = 0;

        this.getComponent(Health)?.on(Health.CHANGE_EVENT, () => {
            this.arcadeBody.setEnable(false);

            this.scene.time.delayedCall(50, () => {
                this.arcadeBody.setEnable(true);
            });
        });

        this._leftSpeedEffect = this.scene.add.sprite(this.x, this.y, 'sprites', 'speed.png');
        this._rightSpeedEffect = this.scene.add.sprite(this.x, this.y, 'sprites', 'speed.png');

        for (const fx of [this._leftSpeedEffect, this._rightSpeedEffect]) {
            fx.setVisible(false);
            fx.setOrigin(0.5, 1.2);
            fx.setBlendMode(Phaser.BlendModes.ADD);
            fx.setAlpha(0.6);
            fx.setDepth(99);
        }
    }

    public showSpeedEffect(duration?: number) {
        const effects = [this._leftSpeedEffect, this._rightSpeedEffect];
        for (const fx of effects) {
            fx.setVisible(true);
        }

        this._speedEffectTween?.remove();
        this._speedEffectTween = this.scene.tweens.add({
            targets: effects,
            alpha: { from: 0.5, to: 1 },
            scaleY: { from: 0.95, to: 1.08 },
            duration: 160,
            yoyo: true,
            repeat: -1
        });

        if (duration && duration > 0) {
            this.scene.time.delayedCall(duration, () => this.hideSpeedEffect());
        }
    }

    public hideSpeedEffect() {
        const effects = [this._leftSpeedEffect, this._rightSpeedEffect];
        this._speedEffectTween?.remove();
        for (const fx of effects) {
            fx.setVisible(false);
            fx.setAlpha(0.85);
            fx.setScale(1);
        }
    }


    public selectPlayerShip(playerShipDataId: number) {
        const playerShipsData = this.scene.cache.json.get('playerShips') as PlayerShipsData;
        this._playerShipData = playerShipsData[playerShipDataId];

        this.setTexture('sprites', this._playerShipData.texture);
        const bodyData = this._playerShipData.body;
        this.arcadeBody.setCircle(bodyData.radius, bodyData.offsetX, bodyData.offsetY);

        this.getComponent(Movement)?.setSpeed(this._playerShipData.movementSpeed);
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime);

        // Press left or right arrow keys to move the player smoothly horizontally using deltaTime
        if (this._cursorKeys.left.isDown) {
            if (this._cursorKeys.shift.isDown) {
                this.angle -= this._playerShipData.movementSpeed * deltaTime;
            } else {
                this.getComponent(Movement)?.moveHorizontally(this, -deltaTime);
            }
        } else if (this._cursorKeys.right.isDown) {
            if (this._cursorKeys.shift.isDown) {
                this.angle += this._playerShipData.movementSpeed * deltaTime;
            } else {
                this.getComponent(Movement)?.moveHorizontally(this, deltaTime);
            }
        }
        // Stop player from going offscreen
        this.x = Phaser.Math.Clamp(this.x, this.displayWidth / 2, this.scene.cameras.main.width - this.displayWidth / 2);

        // Press space to shoot
        if (this._cursorKeys.space.isDown) {
            if (timeSinceLaunch - this._lastShotTime > this._rateOfFire * 1000) {
                this.getComponent(Weapon)?.shoot(this);
                this.scene.sound.play('sfx_laser1');

                this._lastShotTime = timeSinceLaunch;
            }
        }

        if (this._leftSpeedEffect?.visible) {
            const a = Phaser.Math.DegToRad(this.angle);

            const back = this.displayWidth * 0.35;
            const bx = this.x - Math.cos(a) * back;
            const by = this.y - Math.sin(a) * back;

            const baseSide = this.displayWidth * 0.45;

            const sx = Math.cos(a + Math.PI / 2) * baseSide;
            const sy = Math.sin(a + Math.PI / 2) * baseSide;

            const extraRight = 10;
            const srx = Math.cos(a + Math.PI / 2) * (baseSide + extraRight);
            const sry = Math.sin(a + Math.PI / 2) * (baseSide + extraRight);

            this._leftSpeedEffect.setPosition(bx - sx, by - sy);
            this._rightSpeedEffect.setPosition(bx + srx, by + sry);

            this._leftSpeedEffect.setAngle(this.angle);
            this._rightSpeedEffect.setAngle(this.angle);
        }
    }
}