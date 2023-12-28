import { RowDataPacket } from 'mysql2';

export interface ISocietyFinanceResponse extends RowDataPacket {
    job: string;
    label: string;
    bank: number;
    money: number;
    black: number;
}
