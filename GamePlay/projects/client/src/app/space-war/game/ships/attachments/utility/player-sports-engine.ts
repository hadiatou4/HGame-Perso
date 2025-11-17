import Phaser from 'phaser';
import { Ship, SportsEngine, TryCatch } from 'space-war-shared';
import { environment } from '../../../../../../environments/environment';
import { SpaceWarClient } from '../../../space-war-client';

export class PlayerSportsEngine extends SportsEngine {
    private _thrusterSound: Phaser.Sound.BaseSound;
    private _flareParticles: Phaser.GameObjects.Particles.ParticleEmitter;

    static preload(scene: Phaser.Scene): void {
        scene.load.audio(
            'thruster-fire',
            `${environment.baseUrl}/assets/audio/effects/booster-fire.ogg`
        );
    }

    override setShip(s: Ship): this {
        super.setShip(s);
        if (!this._flareParticles) {
            this._addUiComponents();
        }
        return this;
    }

    override update(time: number, delta: number): void {
        super.update(time, delta);
        if (this.enabled && this.ship.remainingFuel > 0) {
            // sound effects
            if (!this._thrusterSound?.isPlaying) {
                this._thrusterSound?.play({ seek: 0.3, volume: 0.2 });
            }
            // visual effects
            this._displayThrusterFire();
        } else {
            if (this._thrusterSound?.isPlaying) {
                this._thrusterSound?.stop();
            }
            // arrêter les particules quand le moteur n'est pas actif
            this._flareParticles?.stop();
        }
    }

    private _displayThrusterFire(): void {
        // démarrer l'émission si elle n'est pas déjà active
        if (!this._flareParticles.emitting) {
            this._flareParticles.start();
        }
    }

    private _addUiComponents(): void {
        const phaserScene = this.scene as Phaser.Scene;

        TryCatch.run(() => {
            this._thrusterSound = phaserScene.sound.add('thruster-fire');
        }, 'none');

        // Créer l'emitter avec toute sa configuration
        this._flareParticles = phaserScene.add.particles(0, 0, 'flares', {
            frame: SpaceWarClient.Constants.UI.SpriteMaps.Flares.blue,
            lifespan: { min: 50, max: 100 },
            speed: { min: 400, max: 600 },
            angle: { min: 170, max: 190 },
            gravityX: 0,
            gravityY: 0,
            scale: { start: 0.2, end: 0 },
            blendMode: 'ADD',
            frequency: 10,
            emitting: false,
        });

        this._flareParticles.setPosition(20, 0); // derrière le vaisseau
        this.ship.rotationContainer.add(this._flareParticles);
        this.ship.rotationContainer.sendToBack(this._flareParticles);
    }
}
