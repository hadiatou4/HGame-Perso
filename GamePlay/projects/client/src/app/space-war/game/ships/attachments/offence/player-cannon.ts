import { Bullet, BulletOptions, Cannon } from 'space-war-shared';
import { PlayerBullet } from './player-bullet';

export class PlayerCannon extends Cannon {
    override getBullet(options: BulletOptions): Bullet {
        let bullet: PlayerBullet;
        if (this.ship) {
            bullet = new PlayerBullet(this.scene, options);
        }
        return bullet;
    }
}
