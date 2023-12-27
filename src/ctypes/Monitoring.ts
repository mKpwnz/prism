import { EServerStatus } from '@enums/EServerStatus';

/**
 * @typedef HeartbeatEntry
 */
export type HeartbeatEntry = {
    status: EServerStatus;
    time: string;
    msg: string;
    ping: string | null;
};

/**
 * @typedef HeartbeatResponse
 */
export type HeartbeatResponse = {
    heartbeatList: {
        [key: number]: HeartbeatEntry[];
    };
    uptimeList: {
        [key: string]: number;
    };
};

/**
 * @typedef PGLMonitor
 */
export type PGLMonitor = {
    id: number;
    name: string;
    sendUrl: any;
    type: string;
};

/**
 * @typedef PublicGroupListEntry
 */
export type PublicGroupListEntry = {
    id: number;
    name: string;
    weight: number;
    monitorList: PGLMonitor[];
};
