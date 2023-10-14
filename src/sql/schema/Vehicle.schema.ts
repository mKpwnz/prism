import { RowDataPacket } from 'mysql2'

export interface IVehicle extends RowDataPacket {
    owner: string
    plate: string
    garage: number
    impounder: number
    vehicle: string
    type: string
    job: string | null
    kofferraum: string
    handschuhfach: string
    inserted: Date
    updated: Date
}
