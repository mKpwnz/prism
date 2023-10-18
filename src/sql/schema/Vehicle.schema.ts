import { RowDataPacket } from 'mysql2'

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IVehicle
 * @extends {RowDataPacket}
 */
export interface IVehicle extends RowDataPacket {
    owner: string
    plate: string
    garage: number
    impounder: number
    vehicle: string
    type: string
    job: string | null
    kofferraum: string | null
    handschuhfach: string | null
    inserted: Date
    updated: Date
}
