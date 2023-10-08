import { RowDataPacket } from 'mysql2'

export interface IItems extends RowDataPacket {
    name: string
    label: string
    weight: number
    rare: boolean
    imglink: string
    can_remove: boolean
    can_stack: boolean
    limit: number
}
