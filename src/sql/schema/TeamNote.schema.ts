import { RowDataPacket } from 'mysql2';

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface ITeamNote
 * @extends {RowDataPacket}
 */
export interface ITeamNote extends RowDataPacket {
    id: number;
    user_steamid: string;
    teamler_discordid: string;
    teamler_discordname: string;
    note: string;
    created_at: Date;
    updated_at: Date;
}
