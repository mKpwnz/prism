import { BotDB, GameDB } from '@sql/Database';
import LogManager from '@utils/Logger';
import { RowDataPacket } from 'mysql2';

interface ISocietyFinanceResponse extends RowDataPacket {
    job: string;
    label: string;
    bank: number;
    money: number;
    black: number;
}

export class CronJobs {
    public static async logSocietyFinance() {
        const [data] = await GameDB.query<ISocietyFinanceResponse[]>(
            `
            SELECT
                j.name AS job,
                aad.money AS bank,
                j.black_money AS black,
                j.money AS money,
                j.label AS label
            FROM jobs AS j
            JOIN addon_account_data AS aad ON aad.account_name = CONCAT('society_', j.name);
            `,
        );
        await BotDB.society_finance.createMany({
            data: [...data],
        });
        LogManager.debug('CronJobs: logSocietyFinance() done.');
    }
}
