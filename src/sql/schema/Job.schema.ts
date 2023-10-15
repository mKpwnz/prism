import { RowDataPacket } from 'mysql2'

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IJob
 * @extends {RowDataPacket}
 */
export interface IJob extends RowDataPacket {
    name: string
    label: string
    armory: string
    money: number
    blackmoney: number
}
