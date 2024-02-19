import { RowDataPacket } from 'mysql2';

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IUser
 * @extends {RowDataPacket}
 */
export interface IUser extends RowDataPacket {
    identifier: string;
    steamId: string;
    license: string;
    name: string;
    accounts: string; // JSON Object need to be casted
    inventory: string; // JSON Object need to be casted
    skin: string; // JSON Object need to be casted
    job: string;
    job_grade: number;
    loadout: string; // JSON Object need to be casted
    position: string; // JSON Object need to be casted
    group: string;
    is_dead: boolean;
    firstname: string;
    lastname: string;
    dateofbirth: string; // need to be casted to Date
    sex: string; // m | f // need to be casted to 'Male' | 'Female'
    height: string; // need to be casted to a number
    status: string; // JSON Object need to be casted
    last_selected_char: number;
    iban: number; // BigInt
    PedArmour: number;
    fblock: string;
    charinfo: string;
    metadata: string;
    animations: string;
    fraksperre: Date;
    crafting_level: number;
    crafting_bonus: number;
    wheel: string;
    inside: string;
    inffa: number;
    xp: number;
    rank: number;

    created: Date;
    updated: Date;
}

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IFindUser
 * @extends {RowDataPacket}
 */
export interface IFindUser extends RowDataPacket {
    playername: string;
    discord: string;
    name: string;
    identifier: string;
    fullname: string;
    firstname: string;
    lastname: string;
    group: string;
    job: string;
    job_grade: number;
    phone_number: string;
    bank: number;
    money: number;
    black_money: number;
    fraksperre: Date;
    crafting_level: number;
}

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface ISchufaUser
 * @extends {RowDataPacket}
 */
export interface ISchufaUserRaw extends RowDataPacket {
    firstname: string;
    lastname: string;
    steamId: string;
    accountsRaw: string;
}

export interface ISchufaUser {
    firstname: string;
    lastname: string;
    steamId: string;
    accounts: {
        bank: number;
        money: number;
        black_money: number;
        negativesum: number;
    };
}
