import { GameDB } from '@sql/Database'
import { RowDataPacket } from 'mysql2'

interface ISocietyFinanceResponse extends RowDataPacket {
    job: string
    label: string
    bank: number
    money: number
    black: number
}

export class CronJobs {
    public static async logSocietyFinance() {
        const [data] = await GameDB.query<ISocietyFinanceResponse[]>(`
		SELECT * FROM jobs j`)
    }
}
