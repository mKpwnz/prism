import { RowDataPacket } from 'mysql2';

export interface IItem extends RowDataPacket {
    name: string;
    label: string;
    weight: number;
    rare: boolean;
    can_remove: boolean;
    limit: number;
    created_at: Date;
    imglink?: string;
    can_stack?: boolean;
    prop?: string;
}
