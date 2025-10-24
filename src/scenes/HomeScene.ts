import {Loader} from "phaser";
import GameConstants from "../GameConstants.ts";
import {GameObjects} from "phaser";

export default class HomeScene extends Phaser.Scene {

    private bg: GameObjects.TileSprite;
    private planet: GameObjects.Image;
    private playerShip: GameObjects.Sprite;
    private pressText: GameObjects.Text;
    private homeBgSpeed = 1;
    private _started: boolean = false;
    private arrowLeft: GameObjects.Text;
    private arrowRight: GameObjects.Text;
    private pillRed: GameObjects.Sprite;
    private pillBlue: GameObjects.Sprite;


    constructor() {
        super(GameConstants.SceneKeys.HOME);
    }

    preload() {
        const width: number = this.scale.width;
        const y: number = this.scale.height / 2;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(0, y, width, 64);
        this.load.on(Loader.Events.PROGRESS, function (value: number) { // 0-1
            console.log("Loading : " + value);

            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(0, y, width * value, 64);
        });
        this.load.on(Loader.Events.COMPLETE, function () {
            console.log("Loading complete");

            progressBar.destroy();
            progressBox.destroy();
        });

        this.load.setPath('assets');

        this.load.image('bg', 'Backgrounds/darkPurple.png');
        this.load.image('planet', 'Planets/planet00.png');
        this.load.atlas('sprites', 'Spritesheet/gameSprites.png', 'Spritesheet/gameSprites.json');
        this.load.bitmapFont('future-bmp', 'Fonts/kenvector_future.png', 'Fonts/kenvector_future.xml');
        this.load.font('future', 'Fonts/kenvector_future.ttf');
        this.load.json('playerShips', 'Data/playerShips.json');
        this.load.audio('sfx_laser1', 'Sounds/sfx_laser1.ogg');
        this.load.audio('sfx_laser2', 'Sounds/sfx_laser2.ogg');
    }

    create() {

        this._started = false;
        this.input.keyboard?.removeAllListeners();
        this.input.keyboard && (this.input.keyboard.enabled = true);
        this.scene.stop(GameConstants.SceneKeys.MAIN_UI);
        const bgMargin = 512;
        this.bg = this.add
        .tileSprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width + bgMargin,
            this.cameras.main.height + bgMargin,
            "bg"
        )
        .setTileScale(2);

        this.planet = this.add.image(0, -512, "planet").setOrigin(0).setDepth(0);

        const ships: any = this.cache.json.get("playerShips");
        const shipFrame: string = ships?.[1]?.texture ?? "ship1.png";

        this.playerShip = this.add
        .sprite(this.cameras.main.centerX, this.cameras.main.centerY, "sprites", shipFrame)
        .setAngle(-90)
        .setDepth(10);

        this.tweens.add({
            targets: this.playerShip,
            y: this.playerShip.y + 50,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut"
        });

        this.add
        .text(this.scale.width / 2, this.scale.height * 0.28, "CODA SHMUP", {
            fontSize: "72px",
            color: "#fff",
            fontFamily: "future"
        })
        .setOrigin(0.5)
        .setDepth(20);

        this.pressText = this.add
        .text(this.scale.width / 2, this.scale.height * 0.28 + 72, "Press SPACE to start", {
            fontSize: "32px",
            color: "#fff"
        })
        .setOrigin(0.5)
        .setDepth(20);

        this.tweens.add({
            targets: this.pressText,
            alpha: { from: 1, to: 0.25 },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut"
        });

        this.input.keyboard?.once("keydown-SPACE", () => this.startWithAnimation());

        this.arrowLeft = this.add.text(this.scale.width / 2 - 110, this.scale.height * 0.75, "←",
            {
                fontSize: "64px",
                color: "#ffffff",
                fontFamily: "future"
            }
        );

        this.arrowRight = this.add.text(this.scale.width / 2 + 50, this.scale.height * 0.75, "→",
            {
                fontSize: "64px",
                color: "#ffffff",
                fontFamily: "future"
            }
        );

        this.tweens.add({
            targets: this.arrowLeft,
            y: this.arrowLeft.y + 8,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut"
        });
        this.tweens.add({
            targets: this.arrowRight,
            y: this.arrowRight.y + 8,
            duration: 600,
            yoyo: true,
            repeat: -1,
            delay: 300,
            ease: "Sine.inOut"
        });

        this.add.text(this.scale.width / 2, this.scale.height * 0.82, "Use ← → to move your ship",
            {
                fontSize: "28px",
                color: "#ffffff",
                fontFamily: "future"
            }
        ).setOrigin(0.5);


        this.pillRed = this.add.sprite(this.scale.width / 2 - 60, this.scale.height * 0.9, "sprites", "pill_red.png").setScale(2);

        this.pillBlue = this.add.sprite(this.scale.width / 2 + 60, this.scale.height * 0.9, "sprites", "pill_blue.png").setScale(2);

        this.tweens.add({
            targets: [this.pillRed, this.pillBlue],
            scale: { from: 2, to: 2.2 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut"
        });

        this.add.text(this.scale.width / 2, this.scale.height * 0.95, "Red = Heal   |   Blue = Speed Boost",
            {
                fontSize: "22px",
                color: "#ffffff",
                fontFamily: "future"
            }
        ).setOrigin(0.5);


        console.log("HomeScene created");
    }

    private startWithAnimation() {
        if (this._started) return;
        this._started = true;

        this.tweens.add({
            targets: this,
            homeBgSpeed: 5,
            duration: 500,
            ease: "Sine.easeOut"
        });

        this.tweens.add({
            targets: this.planet,
            y: this.planet.displayHeight + 512,
            duration: 1000,
            ease: "Sine.easeOut" 

        });

        this.tweens.add({
            targets: [this.arrowLeft, this.arrowRight, this.pillRed, this.pillBlue, this.pressText],
            alpha: 0,
            duration: 300,
            ease: "Sine.easeIn"
        });

        this.tweens.add({
            targets: this.playerShip,
            y: -this.playerShip.displayHeight,
            duration: 1000,
            ease: "Sine.easeIn",
            onComplete: () => {
                this.scene.launch(GameConstants.SceneKeys.MAIN_UI);
                this.scene.start(GameConstants.SceneKeys.MAIN_GAME, { entry: 'fromHome' });
            }
        });

    }

    update(_time: number, dt: number) {
        this.bg.tilePositionY -= 0.1 * dt * this.homeBgSpeed;
        this.planet.y += 0.40 * dt;
  }
}