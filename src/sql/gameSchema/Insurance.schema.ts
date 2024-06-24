import { RowDataPacket } from 'mysql2';

export interface IInsurance extends RowDataPacket {
    plate: string;
    ts: Date;
    premium: boolean;
}
