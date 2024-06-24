import { RowDataPacket } from 'mysql2';

export interface IJob extends RowDataPacket {
    name: string;
    label: string;
    armory: string;
    money: number;
    blackmoney: number;
}
