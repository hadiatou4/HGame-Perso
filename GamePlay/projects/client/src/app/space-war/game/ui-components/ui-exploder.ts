import { Exploder, ExploderOptions, TryCatch } from 'space-war-shared';
import { environment } from '../../../../environments/environment';
import { SpaceWarClient } from '../space-war-client';

export class UiExploder extends Exploder {
    private _destroyedSound: Phaser.Sound.BaseSound;
    private _flareParticleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private _explosionParticleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    static preload(scene: Phaser.Scene): void {
        scene.load.image(
            'explosion',
            `${environment.baseUrl}/assets/particles/explosion.png`
        );
        scene.load.spritesheet(
            'flares',
            `${environment.baseUrl}/assets/particles/flares.png`,
            {
                frameWidth: 130,
                frameHeight: 132,
                startFrame: 0,
                endFrame: 4,
            }
        );
        scene.load.audio(
            'explosion',
            `${environment.baseUrl}/assets/audio/effects/ship-explosion.ogg`
        );
    }

    constructor(scene: Phaser.Scene) {
        super(scene);
        TryCatch.run(
            () =>
                (this._destroyedSound = this.scene.sound.add('explosion', {
                    volume: 0.1,
                })),
            'warn',
            'unable to load explosion sound',
            'none'
        );
        TryCatch.run(
            () =>
                (this._flareParticleEmitter = this.scene.add.particles(
                    0,
                    0,
                    'flares',
                    {
                        speed: { min: 200, max: 600 },
                        lifespan: { min: 100, max: 500 },
                        scale: { start: 1, end: 0 },
                        angle: { min: 0, max: 360 },
                        blendMode: 'ADD',
                        emitting: false,
                    }
                )),
            'warn',
            'unable to load flares sprite as particles',
            'none'
        );
        TryCatch.run(
            () =>
                (this._explosionParticleEmitter = this.scene.add.particles(
                    0,
                    0,
                    'explosion',
                    {
                        speed: { min: 0, max: 2 },
                        lifespan: { min: 500, max: 1000 },
                        scale: { start: 1, end: 0 },
                        angle: { min: 0, max: 360 },
                        blendMode: 'ADD',
                        emitting: false,
                    }
                )),
            'warn',
            'unable to load explosion sprite as particles',
            'none'
        );
    }

    override explode(options: ExploderOptions): this {
        TryCatch.run(() => this._destroyedSound.play(), 'none');

        // Configuration et explosion principale
        this._explosionParticleEmitter.setDepth(
            SpaceWarClient.Constants.UI.Layers.PLAYER
        );
        this._explosionParticleEmitter.setConfig({
            lifespan: { min: 500, max: 1000 },
            speed: { min: 0, max: 2 },
            scale: { start: options.scale ?? 1, end: 0 },
            gravityX: 0,
            gravityY: 0,
            blendMode: 'ADD',
        });
        this._explosionParticleEmitter.explode(
            3,
            options.location.x,
            options.location.y
        );

        // Configuration et explosion des flares
        this._flareParticleEmitter.setDepth(
            SpaceWarClient.Constants.UI.Layers.PLAYER
        );
        this._flareParticleEmitter.setConfig({
            frame: SpaceWarClient.Constants.UI.SpriteMaps.Flares.red as number,
            lifespan: { min: 100, max: 500 },
            speed: { min: 200, max: 600 },
            scale: { start: options.scale ?? 1, end: 0 },
            gravityX: 0,
            gravityY: 0,
            blendMode: 'ADD',
        });
        this._flareParticleEmitter.explode(
            10,
            options.location.x,
            options.location.y
        );

        return this;
    }
}
