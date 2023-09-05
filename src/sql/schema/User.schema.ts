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
    phone_number_HUND: string // TODO: Delete
    last_property: string // TODO: Delete
    status: string // JSON Object need to be casted
    ped: string // TODO: Delete
    pin_bank: number // TODO: Delete
    last_selected_char: number
    house: string // TODO: Delete
    last_house: number // TODO: Delete
    bought_furniture: string // TODO: Delete
    iban: number // BigInt
    PedArmour: number
    fblock: string
    apps: string // TODO: Delete
    widget: string // TODO: Delete
    bt: string // TODO: Delete
    charinfo: string
    metadata: string
    cryptocurrency: string // TODO: Delete
    phonePos: string // TODO: Delete
    spotify: string // TODO: Delete
    animations: string
    fraksperre: Date
    crafting_level: number
    jail: number // TODO: Delete
    crafting_bonus: number
    wheel: string
    inside: string
    inffa: number
    xp: number
    rank: number

    created: Date
    updated: Date
}
