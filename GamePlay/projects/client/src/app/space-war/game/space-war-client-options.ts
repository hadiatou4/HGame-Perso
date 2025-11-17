import { Logging } from 'space-war-shared';

export type SpaceWarClientOptions = {
    debug?: boolean;
    loglevel?: Logging.LogLevel;
    width?: number;
    height?: number;
    parentElementId?: string;
};
