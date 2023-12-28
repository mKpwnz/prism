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

/**
 * @typedef DiscordResponseGroupe
 */
export type DiscordResponseGroupe = {
    name: string;
    member: DiscordResponse[];
};
