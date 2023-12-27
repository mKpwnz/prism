import { GameDB } from '@sql/Database';
import { IVersicherung } from '@sql/schema/Versicherung.schema';

export class VersicherungRepository {
    public static async deleteVersicherungenByNumberplate(
        versicherung: IVersicherung,
    ): Promise<void> {
        await GameDB.query('DELETE FROM `versicherungen` WHERE `plate` = ?', [versicherung.plate]);
    }

    public static async getVersicherungenByNumberplate(plate: string): Promise<IVersicherung[]> {
        const [versicherungen] = await GameDB.query<IVersicherung[]>(
            'SELECT * FROM `versicherungen` WHERE `plate` = ?',
            [plate],
        );

        return versicherungen;
    }

    // @TODO: Add return: Count of inserted rows
    public static async addVersicherung(kennzeichen: string, dauer: number, premium: boolean) {
        await GameDB.query<IVersicherung[]>(
            'INSERT INTO `versicherungen` (`plate`, `ts`, `premium`) VALUES (?, ADDDATE(NOW (), INTERVAL ? DAY), ?) ON DUPLICATE KEY UPDATE ts = ADDDATE(NOW (), INTERVAL ? DAY), premium = ? RETURNING * ',
            [kennzeichen, dauer, premium ? 1 : 0, dauer, premium ? 1 : 0],
        );
    }
}
