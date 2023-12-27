import { RowDataPacket } from 'mysql2';

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IInsurance
 * @extends {RowDataPacket}
 */
export interface IInsurance extends RowDataPacket {
    plate: string;
    ts: Date;
    premium: boolean;
}
