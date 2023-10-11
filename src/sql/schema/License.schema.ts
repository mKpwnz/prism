import { RowDataPacket } from 'mysql2'

export interface IUserLicense extends RowDataPacket {
    id: number
    type: string
    owner: string
    character_id: number | null
}
