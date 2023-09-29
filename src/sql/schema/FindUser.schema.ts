import { RowDataPacket } from 'mysql2'

export interface IFindUser extends RowDataPacket {
    identifier: string
    group: string
    name: string
    job: string
    fraksperre: Date
    job_grade: number
    firstname: string
    lastname: string
    crafting_level: number
    fullname: string
    bank: number
    money: number
    black_money: number
    discord: string
    playername: string
    phone_number: string
}
