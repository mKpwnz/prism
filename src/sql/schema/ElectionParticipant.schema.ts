import { RowDataPacket } from 'mysql2'

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IElectionParticipant
 * @extends {RowDataPacket}
 */
export interface IElectionParticipant extends RowDataPacket {
    id: number
    electionid: number
    identifier: string
    name: string
}
