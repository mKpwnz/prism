import { EServerStatus } from '@enums/EServerStatus';

/**
 * @typedef DiscordResponse
 */
export type HeartbeatEntry = {
    status: EServerStatus;
    time: string;
    msg: string;
    ping: string | null;
};
