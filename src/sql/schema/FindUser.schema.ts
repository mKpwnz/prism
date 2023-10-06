import { RowDataPacket } from 'mysql2'

export interface IFindUser extends RowDataPacket {
    playername: string
    discord: string
    name: string
    identifier: string
    fullname: string
    firstname: string
    lastname: string
    group: string
    job: string
    job_grade: number
    phone_number: string
    bank: number
    money: number
    black_money: number
    fraksperre: Date
    crafting_level: number
}
