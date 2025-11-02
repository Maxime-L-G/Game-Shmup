import {GameObjects, Plugins, Physics, Scene} from "phaser";
import Health from "../components/Health.ts";
import Bullet from "../entities/Bullet.ts";
import Enemy from "../entities/Enemy.ts";
import Player from "../entities/Player.ts";
import GroupUtils from "../utils/GroupUtils.ts";
import GameConstants from "../GameConstants.ts";
import RegistryConstants from "../RegistryConstants.ts";
import Power from "../entities/Power.ts";
import {HealEffect, SpeedBoostEffect} from "../components/BoostEffect.ts";
import SineSpreadEnemy from "../entities/SineSpreadEnemy.ts";

export default class EntityManager extends Plugins.ScenePlugin {
    public static readonly PLUGIN_KEY: string = 'EntityManager';
    public static readonly MAPPING_NAME: string = 'entityManager';

    // noinspection JSUnusedGlobalSymbols
    private readonly bulletGroupConfig = {
        classType: Bullet,
        maxSize: 256,
        runChildUpdate: true,
        createCallback: (bullet: GameObjects.GameObject) => {
            (bullet as Bullet).init();
        }
    }

    private _player: Player;
    private _playerBullets: Physics.Arcade.Group;
    private _enemies: Physics.Arcade.Group;
    private _enemyBullets: Physics.Arcade.Group;
    private _powerEffects: Physics.Arcade.Group;
    private _lastSineSpawn = 0;
    private readonly SINE_COOLDOWN = 8000;


    constructor(scene: Scene, pluginManager: Plugins.PluginManager) {
        super(scene, pluginManager, EntityManager.PLUGIN_KEY);

        console.log("[EntityManager] Initialized");
    }

    destroy() {
        super.destroy();

        console.log("[EntityManager] Destroyed");
    }

    public initAndSpawnPlayer(): Player {
        this._playerBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(64, this._playerBullets);

        this._player = new Player(this.scene!, this.scene!.cameras.main.centerX, this.scene!.cameras.main.height - 128);
        this._player.init(this._playerBullets);

        console.log("[EntityManager] Player spawned");

        this.game!.events.emit(GameConstants.Events.PLAYER_SPAWNED_EVENT, this._player);

        return this._player;
    }

    public initEnemies(): Physics.Arcade.Group {
        this._enemyBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(256, this._enemyBullets);

        (this.scene as any).enemyBullets = this._enemyBullets;

        this._enemies = this.scene!.physics.add.group({
            classType: Enemy,
            defaultKey: 'sprites',
            defaultFrame: 'ufoRed.png',
            createCallback: (obj) => {
                if (obj instanceof Enemy) {
                    (obj as Enemy).init(this._enemyBullets);
                } else {
                }
            }
        });


        // Spawn enemies indefinitely
        this.scene!.time.addEvent({
            delay: 1500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        console.log("[EntityManager] Enemies initialized");

        return this._enemies;
    }

    public initPowers(): Physics.Arcade.Group {
        this._powerEffects = this.scene!.physics.add.group({
            classType: Power,
            runChildUpdate: true,
            defaultKey: 'sprites',
            createCallback: (obj: Phaser.GameObjects.GameObject) => {
                (obj as Power).init();
            }
        });

        GroupUtils.populate(4, this._powerEffects);

        this.scene!.time.addEvent({
            delay: 10000,
            callback: this.spawnHeal,
            callbackScope: this,
            loop: true
        });
        this.scene!.time.addEvent({
            delay: 15000,
            callback: this.spawnSpeedBoost,
            callbackScope: this,
            loop: true
        })

        return this._powerEffects;
}

    public initGroupCollisions() {
        this.scene!.physics.add.overlap(this._playerBullets, this._enemies, (bullet, enemy) => {
            this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);

            (bullet as Bullet).disable();
            const enemyHealth = (enemy as any).getComponent?.(Health);
            if (enemyHealth) {
                enemyHealth.damage((bullet as Bullet).damage);
            }
        });

        this.scene!.physics.add.overlap(this._player, this._enemyBullets, (player, bullet) => {
            (bullet as Bullet).disable();
            (player as Player).getComponent(Health)?.damage((bullet as Bullet).damage);

            this.scene?.cameras.main.shake(100, 0.01);
        });

        this.scene!.physics.add.overlap(this._player, this._enemies, undefined, (player, enemy) => {
            this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);

            const enemyHealth = (enemy as Enemy).getComponent(Health);
            enemyHealth?.damage(enemyHealth?.max);

            const playerHealth = (player as Player).getComponent(Health);
            playerHealth?.damage(1);

            this.scene?.cameras.main.shake(100, 0.03);

            return true;
        });

        this.scene!.physics.add.overlap(this._player, this._powerEffects, (player, power) => {
            const powerEntity = power as Power;
            const playerEntity = player as Player;
            
            powerEntity.applyBoostEffect(playerEntity,);

            this.scene?.cameras.main.flash(100, 100);

        });

        console.log("[EntityManager] Group collisions initialized");
    }

    private spawnEnemy() {
        if (this._enemies.countActive(true) >= 5) {
            return;
        }

        const spawnX = Phaser.Math.Between(64, this.scene!.cameras.main.width - 64);
        const spawnY = 0;

        const hasSine = this._enemies.getChildren().some(e =>
            e instanceof SineSpreadEnemy && e.active
        );

        const now = this.scene!.time.now;
        const canSpawnSine = now - this._lastSineSpawn > this.SINE_COOLDOWN;

        const wantSine = Phaser.Math.Between(0, 100) < 5;

        if (!hasSine && canSpawnSine && wantSine) {
            const sine = new SineSpreadEnemy(this.scene!, spawnX, spawnY - 80, "sineSpreadEnemy");
            this._enemies.add(sine);
            this._lastSineSpawn = now;
            this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, sine);
            return;
        }

        const enemy = this._enemies.get() as Enemy;
        if (!enemy) return;

        enemy.enable(spawnX, spawnY);
        this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, enemy);
    }


    private spawnHeal() {
        if (this._powerEffects.countActive(true) >= 1) {
            return;
        }

        const power = this._powerEffects.get() as Power;
        if (!power) {
            return;
        }

        this.game!.events.emit(GameConstants.Events.POWER_SPAWNED_EVENT, power);
        power.setEffect(new HealEffect(1));

        power.enable(Phaser.Math.Between(64, this.scene!.cameras.main.width - 64), 0);

        console.log("[EntityManager] Power heal spawned");
    }

    private spawnSpeedBoost() {
        if (this._powerEffects.countActive(true) >= 2) {
            return;
        }

        const power = this._powerEffects.get() as Power;
        if (!power) {
            return;
        }

        this.game!.events.emit(GameConstants.Events.POWER_SPAWNED_EVENT, power);

        power.setEffect(new SpeedBoostEffect(1.6, 7000));
        power.enable(Phaser.Math.Between(64, this.scene!.cameras.main.width - 64), 0);

        console.log("[EntityManager] Power speed boost spawned");
    }
}