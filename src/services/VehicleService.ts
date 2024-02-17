import { RconClient } from '@class/RconClient';
import { GameDB } from '@sql/Database';
import { IVehicle } from '@sql/schema/Vehicle.schema';
import { Helper } from '@utils/Helper';
import { ResultSetHeader } from 'mysql2';

export class VehicleService {
    // @TODO Is a Vehicle truly unique to a plate?
    public static async getVehicleByNumberplate(
        numberplate: string,
    ): Promise<IVehicle | undefined> {
        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE plate = ?`,
            [Helper.formatNumberplate(numberplate)],
        );

        return vehicles[0];
    }

    public static async getNewestVehicleByOwner(identifier: string): Promise<IVehicle | undefined> {
        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE owner = ? ORDER BY inserted DESC LIMIT 1`,
            [identifier],
        );

        return vehicles[0];
    }

    public static async changeVehiclePlate(
        oldplate: string,
        newplate: string,
    ): Promise<boolean | Error> {
        if (oldplate.length > 8) {
            return new Error(
                `Das Kennzeichen **${oldplate}** ist zu lang. \nDas Kennzeichen darf maximal 8 Zeichen lang sein.`,
            );
        }
        if (newplate.length > 8) {
            return new Error(
                `Das Kennzeichen **${newplate}** ist zu lang. \nDas Kennzeichen darf maximal 8 Zeichen lang sein.`,
            );
        }
        if (!newplate.toUpperCase().match(/^[A-Z0-9 ]*$/g)) {
            return new Error(
                `Das Kennzeichen **${newplate}** enthält ungültige Zeichen. \nDas Kennzeichen darf nur aus Buchstaben und Zahlen bestehen.`,
            );
        }
        const newplatefmt = Helper.formatNumberplate(newplate);
        const vehicle = await VehicleService.getVehicleByNumberplate(oldplate);
        if (!vehicle) {
            return new Error(`Es wurden keine Fahrzeuge mit dem Kennzeichen ${oldplate} gefunden.`);
        }
        if (vehicle.garage < 0) {
            return new Error(
                `Das Fahrzeug mit dem Kennzeichen **${oldplate}** ist nicht in einer Garage geparkt und kann daher nicht bearbeitet werden.`,
            );
        }
        const newplatevehicle = await VehicleService.getVehicleByNumberplate(newplate);
        if (newplatevehicle) {
            return new Error(`Es existiert bereits ein Fahrzeug mit dem Kennzeichen ${newplate}.`);
        }
        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE owned_vehicles SET plate = ?, vehicle = JSON_SET(vehicle, '$.plate', ?) WHERE plate = ?`,
            [newplatefmt, newplatefmt, vehicle.plate],
        );

        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Des Fahrzeug mit dem Kennzeichen ${oldplate} konnte nicht bearbeitet werden.`,
            );
        }
        await RconClient.sendCommand(`unloadtrunk ${oldplate}`);
        await RconClient.sendCommand(`debugtrunk ${oldplate}`);
        return true;
    }
}
