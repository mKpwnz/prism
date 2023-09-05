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
    phone_number: string // TODO: Delete
    last_property: string
    status: string // JSON Object need to be casted
    ped: string
    pin_bank: number
    last_selected_char: number
    house: string
    last_house: number
    bought_furniture: string
    iban: number // BigInt
    PedArmour: number
    fblock: string
    apps: string // TODO: Delete
    widget: string // TODO: Delete
    bt: string
    charinfo: string
    metadata: string
    cryptocurrency: string
    phonePos: string
    spotify: string
    animations: string
    fraksperre: Date
    crafting_level: number
    jail: number
    crafting_bonus: number
    wheel: string
    inside: string
    inffa: number
    xp: number
    rank: number

    created: Date
    updated: Date
}
