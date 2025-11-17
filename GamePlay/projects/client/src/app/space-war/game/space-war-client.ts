import 'phaser';
import { SpaceWar, Size, AiController, Logging } from 'space-war-shared';
import { GameOverScene } from './scenes/game-over-scene';
import { GameplayHudScene } from './scenes/gameplay-hud-scene';
import { GameplayScene } from './scenes/gameplay-scene';
import { StartupScene } from './scenes/startup-scene';
import { SpaceWarClientOptions } from './space-war-client-options';
import { MultiplayerScene } from './scenes/multiplayer-scene';
import { MultiplayerHudScene } from './scenes/multiplayer-hud-scene';
import { GameMode } from './interfaces/game-mode';
import { SetNameScene } from './scenes/set-name-scene';
import { environment } from '../../../environments/environment';
import { ClientSocketManager } from './utilities/client-socket-manager';
import { Colors, Styles } from 'phaser-ui-components';

export class SpaceWarClient {
    constructor(options?: SpaceWarClientOptions) {
        const parent: HTMLDivElement = document.getElementById(
            options?.parentElementId || 'space-war'
        ) as HTMLDivElement;
        const size = SpaceWarClient.getSize(options?.parentElementId);
        SpaceWar.debug = options.debug ?? false;
        let conf: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: options?.width || size.width,
            height: options?.height || size.height,
            scale: {
                mode: Phaser.Scale.NONE,
                autoCenter: Phaser.Scale.NONE,
            },
            backgroundColor: '#000000',
            parent: parent,
            physics: {
                default: 'arcade',
                arcade: {
                    debug: SpaceWar.debug,
                    gravity: { x: 0, y: 0 },
                },
            },
            roundPixels: true,
            scene: [
                StartupScene,
                GameplayScene,
                GameplayHudScene,
                SetNameScene,
                MultiplayerScene,
                MultiplayerHudScene,
                GameOverScene,
            ],
        };
        SpaceWar.game = new Phaser.Game(conf);
        SpaceWar.game.events.on(Phaser.Core.Events.READY, () => {
            SpaceWarClient.resize();
            this._createSocket();
        });
        SpaceWar.game.events.on(Phaser.Core.Events.HIDDEN, () => {
            if (SpaceWarClient.mode !== 'multiplayer') {
                SpaceWar.game.scene.getScenes(true).forEach((s) => {
                    SpaceWar.game.scene.pause(s);
                });
            }
        });
        SpaceWar.game.events.on(Phaser.Core.Events.VISIBLE, () => {
            SpaceWar.game.scene.getScenes(false).forEach((s) => {
                if (s.scene.isPaused(s)) {
                    SpaceWar.game.scene.resume(s);
                }
            });
        });
    }

    private _createSocket(): void {
        if (!SpaceWarClient.socket || SpaceWarClient.socket.disconnected) {
            SpaceWarClient.socket = new ClientSocketManager({
                serverUrl: environment.websocket,
            });
        }
    }
}

export namespace SpaceWarClient {
    var _inst: SpaceWarClient;
    export function start(options?: SpaceWarClientOptions): SpaceWarClient {
        SpaceWar.debug = options?.debug ?? false;
        Logging.loglevel = options?.loglevel ?? 'warn';
        if (!_inst) {
            _inst = new SpaceWarClient(options);
        }
        return _inst;
    }
    export function stop(): void {
        if (_inst) {
            SpaceWar.game?.destroy(true, true);
        }
    }
    export function resize(): void {
        const canvas: HTMLCanvasElement = SpaceWar.game?.canvas;
        if (canvas) {
            canvas.width = 0; // allow container to collapse
            canvas.height = 0; // allow container to collapse
            canvas.style.margin = '0px';
            canvas.style.padding = '0px';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            const size = SpaceWarClient.getSize();
            canvas.width = size.width;
            canvas.height = size.height;
            SpaceWar.game?.scale.resize(size.width, size.height);
        }
        SpaceWar.game?.scene.getScenes(true).forEach((s) => {
            if (s['resize']) {
                s['resize']();
            } else {
                s.scene.restart();
            }
        });
    }
    export function getSize(parentId?: string): Size {
        let size: Size;
        try {
            const main = document.querySelector('main') as HTMLElement;
            const s = main.getBoundingClientRect();
            size = { width: s.width, height: s.height };
        } catch (e) {
            /* ignore */
        }
        if (!size) {
            const parent = document.getElementById(
                parentId || SpaceWar.Constants.GAME_NAME
            );
            const s = parent.getBoundingClientRect();
            size = { width: s.width, height: s.height };
        }
        return size;
    }
    export var socket: ClientSocketManager;
    export var playerShipId: string;
    export var playerData: SpaceWar.UserData;
    export const opponents = new Array<AiController>();
    export var mode: GameMode = 'singleplayer';
    export namespace Constants {
        export namespace UI {
            export namespace Layers {
                export const BACKGROUND = 0;
                export const STELLAR = 1;
                export const PLAYER = 2;
                export const HUD = 3;
            }
            export namespace SpriteMaps {
                export namespace Flares {
                    export const blue = 0;
                    export const green = 1;
                    export const red = 2;
                    export const white = 3;
                    export const yellow = 4;
                }
            }
            export namespace ElementStyles {
                export namespace Button {
                    export const TEXT = {
                        font: '20px Courier',
                        color: '#ddffdd',
                        align: 'center',
                        alpha: 1,
                    } as const;
                    export const TEXT_DISABLED = {
                        ...TEXT,
                        color: Colors.toHexString(Colors.secondary),
                        alpha: 0.2,
                    } as const;
                    export const BACKGROUND = {
                        fillStyle: {
                            color: 0x808080,
                            alpha: 0.2,
                        },
                    } as const;
                    export const BACKGROUND_HOVER = {
                        ...BACKGROUND,
                        fillStyle: {
                            color: 0x80ff80,
                            alpha: 0.5,
                        },
                    } as const;
                    export const BACKGROUND_DISABLED = {
                        ...BACKGROUND,
                        fillStyle: {
                            ...BACKGROUND.fillStyle,
                            alpha: 0.1,
                        },
                    } as const;
                }
                export namespace Menu {
                    export const PADDING = 10;
                    export const CORNER_RADIUS = 20;
                    export namespace Header {
                        export const TEXT = Styles.warning().text;
                        export const BACKGROUND = Styles.warning().graphics;
                    }
                    export namespace Body {
                        export const TEXT = Styles.Outline.warning().text;
                        export const BACKGROUND = {
                            ...Styles.Outline.warning().graphics,
                            fillStyle: {
                                color: Colors.dark,
                                alpha: 0.75,
                            },
                        } as const;
                    }
                    export namespace Button {
                        export const TEXT = Body.TEXT;
                        export const TEXT_HOVER = {
                            ...TEXT,
                            color: Colors.toHexString(Colors.dark),
                        } as const;
                        export const BACKGROUND = Body.BACKGROUND;
                        export const BACKGROUND_DISABLED = {
                            ...BACKGROUND,
                            fillStyle: {
                                ...BACKGROUND.fillStyle,
                                alpha: 0.1,
                            },
                        } as const;
                        export const BACKGROUND_HOVER = {
                            ...BACKGROUND,
                            fillStyle: {
                                ...BACKGROUND.fillStyle,
                                color: Colors.warning,
                                alpha: 1,
                            },
                        } as const;
                    }
                }
            }
        }
    }
}
