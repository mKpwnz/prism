import { RowDataPacket } from 'mysql2'

export interface IElection extends RowDataPacket {
    id: number
    name: string
    job: string | null
    status: number
    created: Date
    updated: Date
}
