import { GameDB } from '@sql/Database';
import { IInsurance } from '@sql/schema/Versicherung.schema';
import { Helper } from '@utils/Helper';
import { ResultSetHeader } from 'mysql2';

export class InsuranceService {
    public static async deleteVersicherungenByNumberplate(versicherung: IInsurance): Promise<void> {
        await GameDB.query('DELETE FROM `versicherungen` WHERE `plate` = ?', [versicherung.plate]);
    }

    public static async getInsuranceByNumberplate(plate: string): Promise<IInsurance[]> {
        const [versicherungen] = await GameDB.query<IInsurance[]>(
            'SELECT * FROM `versicherungen` WHERE `plate` = ?',
            [Helper.formatNumberplate(plate)],
        );

        return versicherungen;
    }

    public static async addInsurance(
        plate: string,
        dauer: number,
        premium: boolean,
    ): Promise<boolean> {
        const [result] = await GameDB.query<ResultSetHeader>(
            'INSERT INTO `versicherungen` (`plate`, `ts`, `premium`) VALUES (?, ADDDATE(NOW (), INTERVAL ? DAY), ?) ON DUPLICATE KEY UPDATE ts = ADDDATE(NOW (), INTERVAL ? DAY), premium = ? RETURNING * ',
            [Helper.formatNumberplate(plate), dauer, premium ? 1 : 0, dauer, premium ? 1 : 0],
        );

        return result.affectedRows > 0;
    }
}
