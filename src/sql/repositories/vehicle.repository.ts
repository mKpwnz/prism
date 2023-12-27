import { IVehicle } from '@sql/schema/Vehicle.schema';
import { GameDB } from '@sql/Database';

export class VehicleRepository {
    // @TODO Is a Vehicle truly unique to a plate?
    public static async getVehicleByNumberplate(
        numberplate: string,
    ): Promise<IVehicle | undefined> {
        const [vehicles] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE plate = ?`,
            [numberplate],
        );

        return vehicles[0];
    }
}
