import { RowDataPacket } from 'mysql2';

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IItem
 * @extends {RowDataPacket}
 */
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
