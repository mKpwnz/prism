import { RowDataPacket } from 'mysql2'

export interface IVersicherung extends RowDataPacket {
    plate: string
    ts: Date
    premium: boolean
}
