import { RowDataPacket } from 'mysql2'

export interface IUser extends RowDataPacket {
    identifier: string
    steamId: string
    license: string
    name: string
    accounts: string // JSON Object need to be casted
    inventory: string // JSON Object need to be casted
    skin: string // JSON Object need to be casted
    job: string
    job_grade: number
    loadout: string // JSON Object need to be casted
    position: string // JSON Object need to be casted
    group: string
    is_dead: boolean
    firstname: string
    lastname: string
    dateofbirth: string // need to be casted to Date
    sex: string // m | f // need to be casted to 'Male' | 'Female'
    height: string // need to be casted to a number
    status: string // JSON Object need to be casted
    last_selected_char: number
    iban: number // BigInt
    PedArmour: number
    fblock: string
    charinfo: string
    metadata: string
    animations: string
    fraksperre: Date
    crafting_level: number
    crafting_bonus: number
    wheel: string
    inside: string
    inffa: number
    xp: number
    rank: number

    created: Date
    updated: Date
}
