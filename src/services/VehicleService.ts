import { RconClient } from '@prism/class/RconClient';
import GameserverClient from '@prism/clients/GameserverClient';
import { TFiveMVehicleType } from '@prism/interfaces/IFiveM';
import { IVehicle } from '@prism/sql/gameSchema/Vehicle.schema';
import { formatPlate, generateOAAThash, validatePlate } from '@prism/utils/FiveMHelper';
import { IValidatedPlayer } from '@prism/interfaces/IValidatedPlayer';
import { GameDB } from '@prism/sql/Database';
import { ResultSetHeader } from 'mysql2';

export class VehicleService {
    public static async getVehicleByPlate(plate: string): Promise<IVehicle | Error> {
        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE plate = ?`,
            [formatPlate(plate)],
        );

        if (!vehicles) {
            return new Error(
                `Es konnte kein Fahrzeug mit dem Kennzeichen ${plate} gefunden werden.`,
            );
        }

        return vehicles[0];
    }

    public static async transferVehicle(
        plate: string,
        type: TFiveMVehicleType,
        newlocation: number,
    ): Promise<boolean | Error> {
        const vehicle = await VehicleService.getVehicleByPlate(plate);
        if (vehicle instanceof Error) return vehicle;
        if (vehicle.garage === newlocation) {
            return new Error(
                `Das Fahrzeug mit dem Kennzeichen **${plate}** ist bereits in der Garage **${newlocation}** geparkt.`,
            );
        }

        const garages = await GameserverClient.getAllGarages();
        if (garages instanceof Error) {
            return new Error(garages.message);
        }
        const garage = garages.find((g) => g.garageId === newlocation);
        if (!garage) {
            return new Error(`Es wurde keine Garage mit der ID ${newlocation} gefunden.`);
        }

        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE owned_vehicles SET garage = ?, type = ? WHERE plate = ?`,
            [newlocation, type, vehicle.plate],
        );
        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Das Fahrzeug mit dem Kennzeichen ${plate} konnte nicht bearbeitet werden.`,
            );
        }

        await RconClient.sendCommand(`unloadtrunk ${plate}`);
        await RconClient.sendCommand(`debugtrunk ${plate}`);
        return true;
    }

    public static async changeVehiclePlate(
        oldplate: string,
        newplate: string,
    ): Promise<boolean | Error> {
        const oldplateValid = validatePlate(oldplate);
        if (oldplateValid instanceof Error) return oldplateValid;

        const newplateValid = validatePlate(newplate);
        if (newplateValid instanceof Error) return newplateValid;

        const vehicle = await VehicleService.getVehicleByPlate(oldplate);
        if (vehicle instanceof Error) return vehicle;
        if (vehicle.garage < 0) {
            return new Error(
                `Das Fahrzeug mit dem Kennzeichen **${oldplate}** ist nicht in einer Garage geparkt und kann daher nicht bearbeitet werden.`,
            );
        }

        const newplatevehicle = await VehicleService.getVehicleByPlate(newplate);
        if (newplatevehicle) {
            return new Error(`Es existiert bereits ein Fahrzeug mit dem Kennzeichen ${newplate}.`);
        }

        const newplatefmt = formatPlate(newplate);
        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE owned_vehicles SET plate = ?, vehicle = JSON_SET(vehicle, '$.plate', ?) WHERE plate = ?`,
            [newplatefmt, newplatefmt, formatPlate(oldplate)],
        );

        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Das Fahrzeug mit dem Kennzeichen ${oldplate} konnte nicht bearbeitet werden.`,
            );
        }

        await RconClient.sendCommand(`unloadtrunk ${oldplate}`);
        await RconClient.sendCommand(`debugtrunk ${oldplate}`);
        return true;
    }

    public static async deleteTrunkByPlate(plate: string): Promise<IVehicle | Error> {
        const plateValid = validatePlate(plate);
        if (plateValid instanceof Error) return plateValid;

        const vehicle = await VehicleService.getVehicleByPlate(plate);
        if (vehicle instanceof Error) return vehicle;

        const [res] = await GameDB.execute<ResultSetHeader>(
            `UPDATE owned_vehicles SET kofferraum = '{}' WHERE plate = ?`,
            [plate],
        );

        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Der Kofferraum des Fahrzeugs mit dem Kennzeichen ${plate} konnte nicht gelöscht werden.`,
            );
        }

        await RconClient.sendCommand(`debugtrunk ${plate}`);

        return vehicle;
    }

    public static async deleteVehicleByPlate(plate: string): Promise<IVehicle | Error> {
        const plateValid = validatePlate(plate);
        if (plateValid instanceof Error) return plateValid;

        const vehicle = await VehicleService.getVehicleByPlate(plate);
        if (vehicle instanceof Error) return vehicle;

        const [res] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM owned_vehicles WHERE plate = ?`,
            [vehicle.plate],
        );

        if (res.affectedRows === 0) {
            return new Error(
                `Es ist ein Fehler aufgetreten. Das Fahrzeug mit dem Kennzeichen ${plate} konnte nicht gelöscht werden.`,
            );
        }

        return vehicle;
    }

    public static async getVehiclesBySpawnName(spawnname: string): Promise<IVehicle[] | Error> {
        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE JSON_EXTRACT(vehicle, '$.modelName') = ? OR JSON_EXTRACT(vehicle, '$.model') = ?`,
            [spawnname, generateOAAThash(spawnname)],
        );

        if (!vehicles.length) {
            return new Error(
                `Es konnten keine Fahrzeuge mit dem Spawnnamen **${spawnname}** gefunden werden.`,
            );
        }

        return vehicles;
    }

    public static async createVehicle(
        player: IValidatedPlayer,
        vehicleName: string,
        plate: string | null,
    ): Promise<string | Error> {
        let formattedPlate: string | undefined;
        if (plate) {
            const plateValid = validatePlate(plate);
            if (plateValid instanceof Error) {
                return new Error(plateValid.message);
            }

            formattedPlate = formatPlate(plate);
            if (!formattedPlate) {
                return new Error(`Das Kennzeichen \`${plate}\` ist ungültig.`);
            }

            const vehicle = await VehicleService.getVehicleByPlate(formattedPlate);
            if (vehicle) {
                return new Error(`Es gibt das Kennzeichen \`${formattedPlate}\` schon.`);
            }
        }

        await RconClient.sendCommand(
            `givecardiscord ${player.identifiers.steam} ${vehicleName} ${formattedPlate ?? 'random'}`,
        );

        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE owner = ? ORDER BY inserted DESC LIMIT 1`,
            [player.identifiers.steam],
        );
        const vehicle = vehicles[0];
        if (!vehicle) {
            return new Error(`Das Fahrzeug konnte nicht erstellt werden.`);
        }

        const inserted = new Date(vehicle.inserted);
        if (inserted < new Date(Date.now() - 1000 * 60)) {
            return new Error(`Das Fahrzeug konnte nicht erstellt werden.`);
        }

        return `Das Fahrzeug wurde erstellt und hat das Kennzeichen \`${vehicle.plate}\`.`;
    }
}
