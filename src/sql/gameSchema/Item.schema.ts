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
    imglink: string;
    can_remove: boolean;
    can_stack: boolean;
    limit: number;
}
