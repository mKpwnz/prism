import { RowDataPacket } from 'mysql2'

export interface IBilling extends RowDataPacket {
    id: number
    receiver_identifier: string
    receiver_name: string
    author_identfier: string
    author_name: string
    society: string
    society_name: string
    item: string
    invoice_value: number
    status: string
    notes: string
    sent_date: Date
    limit_pay_date: Date
    fees_amount: number | null
    paid_date: string | null
}
