import { EServerStatus } from '@enums/EServerStatus';

/**
 * @typedef DiscordResponse
 */
export type DiscordResponse = {
    status: EServerStatus;
    name: string;
    uptime: number;
    print: string;
};
