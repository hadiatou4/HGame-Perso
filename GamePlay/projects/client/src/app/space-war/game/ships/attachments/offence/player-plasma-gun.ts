import { Bullet, BulletOptions, PlasmaGun } from 'space-war-shared';
import { PlayerPlasmaBullet } from './player-plasma-bullet';

export class PlayerPlasmaGun extends PlasmaGun {
    override getBullet(options: BulletOptions): Bullet {
        let bullet: PlayerPlasmaBullet;
        if (this.ship) {
            bullet = new PlayerPlasmaBullet(this.scene, options);
        }
        return bullet;
    }
}
