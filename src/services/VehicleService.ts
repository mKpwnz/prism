import { RconClient } from '@class/RconClient';
import GameserverClient from '@clients/GameserverClient';
import { TFiveMVehicleType } from '@interfaces/IFiveM';
import { IVehicle } from '@sql/schema/Vehicle.schema';
import { formatNumberplate, generateOAAThash, validateNumberplate } from '@utils/FiveMHelper';
import { VehicleRepository } from '@repositories/VehicleRepository';
import { IValidatedPlayer } from '@interfaces/IValidatedPlayer';

export class VehicleService {
    public static async getVehicleOrErrorByPlate(plate: string): Promise<IVehicle | Error> {
        const formattedPlate = formatNumberplate(plate);
        const vehicle = await VehicleRepository.getVehicleByNumberplate(formattedPlate);
        if (!vehicle) {
            return new Error(
                `Es konnte kein Fahrzeug mit dem Kennzeichen ${plate} gefunden werden.`,
            );
        }

        return vehicle;
    }

    public static async transferVehicle(
        plate: string,
        type: TFiveMVehicleType,
        newlocation: number,
    ): Promise<boolean | Error> {
        const vehicle = await VehicleService.getVehicleOrErrorByPlate(plate);
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

        const result = await VehicleRepository.updateVehicleGarage(
            newlocation,
            type,
            vehicle.plate,
        );
        if (result instanceof Error) return result;

        await RconClient.sendCommand(`unloadtrunk ${plate}`);
        await RconClient.sendCommand(`debugtrunk ${plate}`);
        return true;
    }

    public static async changeVehiclePlate(
        oldplate: string,
        newplate: string,
    ): Promise<boolean | Error> {
        const oldplateValid = validateNumberplate(oldplate);
        if (oldplateValid instanceof Error) return oldplateValid;

        const newplateValid = validateNumberplate(newplate);
        if (newplateValid instanceof Error) return newplateValid;

        const vehicle = await VehicleService.getVehicleOrErrorByPlate(oldplate);
        if (vehicle instanceof Error) return vehicle;
        if (vehicle.garage < 0) {
            return new Error(
                `Das Fahrzeug mit dem Kennzeichen **${oldplate}** ist nicht in einer Garage geparkt und kann daher nicht bearbeitet werden.`,
            );
        }

        const newplatevehicle = await VehicleRepository.getVehicleByNumberplate(newplate);
        if (newplatevehicle) {
            return new Error(`Es existiert bereits ein Fahrzeug mit dem Kennzeichen ${newplate}.`);
        }

        const newplatefmt = formatNumberplate(newplate);
        const plateUpdated = await VehicleRepository.updateVehiclePlate(oldplate, newplatefmt);
        if (plateUpdated instanceof Error) return plateUpdated;

        await RconClient.sendCommand(`unloadtrunk ${oldplate}`);
        await RconClient.sendCommand(`debugtrunk ${oldplate}`);
        return true;
    }

    public static async deleteTrunk(plate: string): Promise<IVehicle | Error> {
        const plateValid = validateNumberplate(plate);
        if (plateValid instanceof Error) return plateValid;

        const vehicle = await VehicleService.getVehicleOrErrorByPlate(plate);
        if (vehicle instanceof Error) return vehicle;

        const deleted = await VehicleRepository.deleteTrunk(vehicle.plate);
        if (deleted instanceof Error) return deleted;

        await RconClient.sendCommand(`debugtrunk ${plate}`);

        return vehicle;
    }

    public static async deleteVehicle(plate: string): Promise<IVehicle | Error> {
        const plateValid = validateNumberplate(plate);
        if (plateValid instanceof Error) return plateValid;

        const vehicle = await VehicleService.getVehicleOrErrorByPlate(plate);
        if (vehicle instanceof Error) return vehicle;

        const deleted = await VehicleRepository.deleteVehicle(vehicle.plate);
        if (deleted instanceof Error) return deleted;

        return vehicle;
    }

    public static async getVehiclesBySpawnName(spawnname: string): Promise<IVehicle[] | Error> {
        return VehicleRepository.getVehiclesBySpawnName(spawnname, generateOAAThash(spawnname));
    }

    public static async createVehicle(
        player: IValidatedPlayer,
        vehicleName: string,
        plate: string | null,
    ): Promise<string | Error> {
        let formattedPlate: string | undefined;
        if (plate) {
            const plateValid = validateNumberplate(plate);
            if (plateValid instanceof Error) {
                return new Error(plateValid.message);
            }

            formattedPlate = formatNumberplate(plate);
            if (!formattedPlate) {
                return new Error(`Das Kennzeichen \`${plate}\` ist ungültig.`);
            }

            const vehicle = await VehicleRepository.getVehicleByNumberplate(formattedPlate);
            if (vehicle) {
                return new Error(`Es gibt das Kennzeichen \`${formattedPlate}\` schon.`);
            }
        }

        await RconClient.sendCommand(
            `givecardiscord ${player.identifiers.steam} ${vehicleName} ${formattedPlate ?? 'random'}`,
        );

        const car = await VehicleRepository.getNewestVehicleByOwner(player.identifiers.steam);
        if (!car) {
            return new Error(`Das Fahrzeug konnte nicht erstellt werden.`);
        }

        const inserted = new Date(car.inserted);
        if (inserted < new Date(Date.now() - 1000 * 60)) {
            return new Error(`Das Fahrzeug konnte nicht erstellt werden.`);
        }

        return `Das Fahrzeug wurde erstellt und hat das Kennzeichen \`${car.plate}\`.`;
    }
}
