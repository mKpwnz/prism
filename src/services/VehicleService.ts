import { GameDB } from '@sql/Database';
import { IVehicle } from '@sql/schema/Vehicle.schema';
import { Helper } from '@utils/Helper';

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
}
