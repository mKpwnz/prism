import { GameDB } from '@sql/Database';
import { ResultSetHeader } from 'mysql2';
import { IVehicle } from '@sql/schema/Vehicle.schema';
import { TFiveMVehicleType } from '@interfaces/IFiveM';

export class VehicleRepository {
    public static async getVehiclesBySpawnName(
        spawnname: string,
        hash: number,
    ): Promise<IVehicle[] | Error> {
        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE JSON_EXTRACT(vehicle, '$.modelName') = ? OR JSON_EXTRACT(vehicle, '$.model') = ?`,
            [spawnname, hash],
        );

        if (!vehicles.length) {
            return new Error(
                `Es konnten keine Fahrzeuge mit dem Spawnnamen **${spawnname}** gefunden werden.`,
            );
        }

        return vehicles;
    }

    public static async getVehicleByNumberplate(
        numberplate: string,
    ): Promise<IVehicle | undefined> {
        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE plate = ?`,
            [numberplate],
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

    public static async updateVehiclePlate(
        oldplate: string,
        newplate: string,
    ): Promise<boolean | Error> {
        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE owned_vehicles SET plate = ?, vehicle = JSON_SET(vehicle, '$.plate', ?) WHERE plate = ?`,
            [newplate, newplate, oldplate],
        );

        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Das Fahrzeug mit dem Kennzeichen ${oldplate} konnte nicht bearbeitet werden.`,
            );
        }
        return true;
    }

    public static async updateVehicleGarage(
        newLocation: number,
        type: TFiveMVehicleType,
        plate: string,
    ): Promise<boolean | Error> {
        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE owned_vehicles SET garage = ?, type = ? WHERE plate = ?`,
            [newLocation, type, plate],
        );
        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Das Fahrzeug mit dem Kennzeichen ${plate} konnte nicht bearbeitet werden.`,
            );
        }
        return true;
    }

    public static async deleteTrunk(plate: string): Promise<boolean | Error> {
        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE owned_vehicles SET kofferraum = '{}' WHERE plate = ?`,
            [plate],
        );

        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Der Kofferraum des Fahrzeugs mit dem Kennzeichen ${plate} konnte nicht gelöscht werden.`,
            );
        }
        return true;
    }

    public static async deleteVehicle(plate: string): Promise<boolean | Error> {
        const [res] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM owned_vehicles WHERE plate = ?`,
            [plate],
        );

        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Das Fahrzeug mit dem Kennzeichen ${plate} konnte nicht gelöscht werden.`,
            );
        }
        return true;
    }
}
