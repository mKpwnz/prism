import { RowDataPacket } from 'mysql2'

export interface IElectionParticipant extends RowDataPacket {
    id: number
    electionid: number
    identifier: string
    name: string
}
