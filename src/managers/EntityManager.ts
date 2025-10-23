import {GameObjects, Plugins, Physics, Scene} from "phaser";
import Health from "../components/Health.ts";
import Bullet from "../entities/Bullet.ts";
import Enemy from "../entities/Enemy.ts";
import Player from "../entities/Player.ts";
import GroupUtils from "../utils/GroupUtils.ts";
import GameConstants from "../GameConstants.ts";
import RegistryConstants from "../RegistryConstants.ts";
import Power from "../entities/Power.ts";

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
    private _powerHeal: Physics.Arcade.Group;

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

        this._enemies = this.scene!.physics.add.group({
            classType: Enemy,
            defaultKey: 'sprites',
            defaultFrame: 'ufoRed.png',
            createCallback: (enemy) => {
                (enemy as Enemy).init(this._enemyBullets);
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

    public initPowerHeal(): Physics.Arcade.Group {
        this._powerHeal = this.scene!.physics.add.group({
            classType: Power,
            runChildUpdate: true,
            defaultKey: 'sprites',
            defaultFrame: 'pill_red.png',
            createCallback: (obj: Phaser.GameObjects.GameObject) => {
                (obj as Power).init();
            }
        });

        GroupUtils.populate(4, this._powerHeal);

        this.scene!.time.addEvent({
            delay: 10000,
            callback: this.spawnPowerHeal,
            callbackScope: this,
            loop: true
        });

        return this._powerHeal;
}

    public initGroupCollisions() {
        this.scene!.physics.add.overlap(this._playerBullets, this._enemies, (bullet, enemy) => {
            this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);

            (bullet as Bullet).disable();
            (enemy as Enemy).getComponent(Health)?.damage((bullet as Bullet).damage);
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

        this.scene!.physics.add.overlap(this._player, this._powerHeal, (player, power) => {

            (player as Player).getComponent(Health)?.heal(1);
            (power as Power).disable();

            this.scene?.cameras.main.flash(100, 100);

        });

        console.log("[EntityManager] Group collisions initialized");
    }

    private spawnEnemy() {
        if (this._enemies.countActive(true) >= 5) {
            return;
        }

        const enemy = this._enemies.get() as Enemy;
        if (!enemy) {
            return;
        }

        enemy.enable(Phaser.Math.Between(64, this.scene!.cameras.main.width - 64), 0);

        this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, enemy);

        console.log("[EntityManager] Enemy spawned");
    }

    private spawnPowerHeal() {
        if (this._powerHeal.countActive(true) >= 1) {
            return;
        }

        const powerHeal = this._powerHeal.get() as Power;
        if (!powerHeal) {
            return;
        }

        powerHeal.enable(Phaser.Math.Between(64, this.scene!.cameras.main.width - 64), 0);

        this.game!.events.emit(GameConstants.Events.POWER_HEAL_SPAWNED_EVENT, powerHeal);

        console.log("[EntityManager] Power heal spawned");
    }
}