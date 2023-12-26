import { RowDataPacket } from 'mysql2';

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IElection
 * @extends {RowDataPacket}
 */
export interface IElection extends RowDataPacket {
    id: number;
    name: string;
    job: string | null;
    status: number;
    created: Date;
    updated: Date;
}
