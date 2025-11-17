import { Ship, SpaceWar } from 'space-war-shared';

export class ServerShip extends Ship {
    override death(emit: boolean = true): void {
        if (this.active) {
            if (emit) {
                this.scene.events.emit(
                    SpaceWar.Constants.Events.SHIP_DEATH,
                    this.currentState
                );
            }
        }
    }
}
