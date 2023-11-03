import { RowDataPacket } from 'mysql2'

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IPhone
 * @extends {RowDataPacket}
 */
export interface IPhone extends RowDataPacket {
    id: string
    phone_number: number
    name: string | null
    pin: string | null
    face_id: string | null
    settings: string | null
    is_setup: boolean | null
    assinged: boolean | null
    battery: number
}

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IPhoneDarkchatAccounts
 * @extends {RowDataPacket}
 */
export interface IPhoneDarkchatAccounts extends RowDataPacket {
    phone_number: number
    username: string
}

export interface IPhoneDarkchatMessages extends RowDataPacket {
    id: number
    channel: string
    sender: string
    content: string | null
    timestamp: Date
}

export interface IPhoneDarkchatMembers extends RowDataPacket {
    channel_name: string
    username: string
}

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IPhoneInstagramAccounts
 * @extends {RowDataPacket}
 */
export interface IPhoneInstagramAccounts extends RowDataPacket {
    displayname: string
    username: string
    password: string
    profile_image: string | null
    bio: string | null
    phone_number: number
    verified: boolean | null
    date_joined: Date
}

/**
 * @description
 * @author mKpwnz
 * @date 19.10.2023
 * @export
 * @interface IPhoneOwnerResponse
 * @extends {RowDataPacket}
 */
export interface IPhoneOwnerResponse extends RowDataPacket {
    firstname: string
    lastname: string
    steamID: string
    phoneNumber: string
    timestamp: string
}
