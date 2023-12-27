import { GameDB } from '@sql/Database';
import { IInsurance } from '@sql/schema/Versicherung.schema';

export class InsuranceRepository {
    public static async deleteVersicherungenByNumberplate(versicherung: IInsurance): Promise<void> {
        await GameDB.query('DELETE FROM `versicherungen` WHERE `plate` = ?', [versicherung.plate]);
    }

    public static async getInsuranceByNumberplate(plate: string): Promise<IInsurance[]> {
        const [versicherungen] = await GameDB.query<IInsurance[]>(
            'SELECT * FROM `versicherungen` WHERE `plate` = ?',
            [plate],
        );

        return versicherungen;
    }

    // @TODO: Add return: Count of inserted rows
    public static async addInsurance(kennzeichen: string, dauer: number, premium: boolean) {
        await GameDB.query<IInsurance[]>(
            'INSERT INTO `versicherungen` (`plate`, `ts`, `premium`) VALUES (?, ADDDATE(NOW (), INTERVAL ? DAY), ?) ON DUPLICATE KEY UPDATE ts = ADDDATE(NOW (), INTERVAL ? DAY), premium = ? RETURNING * ',
            [kennzeichen, dauer, premium ? 1 : 0, dauer, premium ? 1 : 0],
        );
    }
}
