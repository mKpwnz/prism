import { GameDB } from '@prism/sql/Database';
import { IInsurance } from '@prism/sql/gameSchema/Insurance.schema';
import { formatPlate } from '@prism/utils/FiveMHelper';
import { ResultSetHeader } from 'mysql2';

export class InsuranceService {
    public static async deleteInsuranceByPlate(plate: string): Promise<boolean | Error> {
        const [res] = await GameDB.execute<ResultSetHeader>(
            'DELETE FROM `versicherungen` WHERE `plate` = ?',
            [plate],
        );

        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Die Versicherung des Fahrzeug mit dem Kennzeichen ${plate} konnte nicht gelöscht werden.`,
            );
        }
        return true;
    }

    public static async getInsuranceByPlate(plate: string): Promise<IInsurance[] | Error> {
        const [insurances] = await GameDB.query<IInsurance[]>(
            'SELECT * FROM `versicherungen` WHERE `plate` = ?',
            [formatPlate(plate)],
        );

        if (insurances.length !== 1) {
            let message;
            if (insurances.length === 0) message = `Keine Versicherung für ${plate} gefunden!`;
            else message = `Es wurden ${insurances.length} Versicherungen für ${plate} gefunden!`;
            return new Error(message);
        }

        return insurances;
    }

    public static async createInsurance(
        plate: string,
        dauer: number,
        premium: boolean,
    ): Promise<boolean> {
        const [result] = await GameDB.query<ResultSetHeader>(
            'INSERT INTO `versicherungen` (`plate`, `ts`, `premium`) VALUES (?, ADDDATE(NOW (), INTERVAL ? DAY), ?) ON DUPLICATE KEY UPDATE ts = ADDDATE(NOW (), INTERVAL ? DAY), premium = ? RETURNING * ',
            [formatPlate(plate), dauer, premium ? 1 : 0, dauer, premium ? 1 : 0],
        );

        return result.affectedRows > 0;
    }
}
