import { AiController, SpaceWar } from 'space-war-shared';
import { SpaceWarClient } from '../space-war-client';

export class ClientAiController extends AiController {
    override get view(): Phaser.Geom.Polygon {
        const view = super.view;
        if (SpaceWar.debug) {
            const graphics = this.scene.add
                .graphics({
                    lineStyle: { width: 2, color: 0x00ff00 },
                    fillStyle: { color: 0xffff00, alpha: 0.25 },
                })
                .setDepth(SpaceWarClient.Constants.UI.Layers.PLAYER);
            const viewPoints = view.points;
            graphics.beginPath();
            graphics.moveTo(viewPoints[0].x, viewPoints[0].y);
            for (let i = 1; i < viewPoints.length; i++) {
                graphics.lineTo(viewPoints[i].x, viewPoints[i].y);
            }
            graphics.closePath();
            graphics.fillPath();

            this.scene.tweens.add({
                targets: graphics,
                alpha: 0,
                duration: SpaceWar.Constants.Timing.LOW_PRI_UPDATE_FREQ,
                onComplete: () => {
                    graphics.destroy();
                },
            });
        }
        return view;
    }
}
