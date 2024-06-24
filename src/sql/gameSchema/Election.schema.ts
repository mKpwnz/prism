import { RowDataPacket } from 'mysql2';

export interface IElectionParticipant extends RowDataPacket {
    id: number;
    electionid: number;
    identifier: string;
    name: string;
}

export interface IElection extends RowDataPacket {
    id: number;
    name: string;
    job: string | null;
    status: number;
    created: Date;
    updated: Date;
}

export interface IVote extends RowDataPacket {
    name: string;
    vote_count: number;
}
