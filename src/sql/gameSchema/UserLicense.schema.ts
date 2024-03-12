import { RowDataPacket } from 'mysql2';

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IUserLicense
 * @extends {RowDataPacket}
 */
export interface IUserLicense extends RowDataPacket {
    id: number;
    type: string;
    owner: string;
    character_id: number | null;
}
