import { RowDataPacket } from 'mysql2';

export interface ITebexTransactions extends RowDataPacket {
    id: number;
    package: number;
    identifier: string;
    userid: number;
    transaction: string;
    price: number;
    payout: number;
    collected: boolean;
    buytime: Date;
    taketime: Date;
}
