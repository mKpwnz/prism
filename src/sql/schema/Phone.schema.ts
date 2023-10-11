import { RowDataPacket } from 'mysql2'

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

export interface IPhoneDarkchatAccounts extends RowDataPacket {
	phone_number: number
	username: string
}

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