import { GameServerEngine } from 'phaser-game-server-engine';
import { GameLevelOptions, Logging, SpaceWar } from 'space-war-shared';
import { BattleRoyaleScene } from './scenes/battle-royale-scene';
import { ServerSocketManager } from './utilities/server-socket-manager';
import { DynamicDataStore } from 'dynamic-data-store';

export class SpaceWarServer extends GameServerEngine {
    constructor() {
        super({ scene: [BattleRoyaleScene] });

        this.game.events.on(Phaser.Core.Events.READY, () => {
            SpaceWarServer.io = new ServerSocketManager({ io: this.io });
        });
    }
}

export namespace SpaceWarServer {
    export var io: ServerSocketManager;
    export const users = new DynamicDataStore<SpaceWarServer.UserData>({
        indicies: ['fingerprint', 'name'],
    });
    export const rooms = (): Array<BattleRoyaleScene> =>
        SpaceWar.game.scene.getScenes(true).map((s) => s as BattleRoyaleScene);
    export type UserData = SpaceWar.UserData & {
        socketId?: string;
        room?: string;
        shipId?: string;
        deleteAt?: number; // leave undefined or null if active
    };
    export namespace Constants {
        export namespace Rooms {
            export const MAX_BOTS = 25;
        }
        export namespace Map {
            export const MAP_WIDTH = 50; // tiles, not pixels
            export const MAP_HEIGHT = 50;
            export const MAP_OPTIONS: GameLevelOptions = {
                seed: 'spacewar',
                width: MAP_WIDTH, // in tiles, not pixels
                height: MAP_HEIGHT,
                maxRooms: 100,
                roomWidth: { min: MAP_WIDTH - 1, max: MAP_WIDTH },
                roomHeight: { min: MAP_HEIGHT - 1, max: MAP_HEIGHT },
                doorPadding: 0,
            } as const;
        }
    }
}

SpaceWar.debug = false;
Logging.loglevel = 'info';
const server = new SpaceWarServer();
SpaceWar.game = server.game;
