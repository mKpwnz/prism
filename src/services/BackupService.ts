import S3Client from '@prism/clients/S3Client';
import { Sentry } from '@prism/Bot';
import { GameDB } from '@prism/sql/Database';
import { RowDataPacket } from 'mysql2';
import { IUndergroundTuning, IVehicle } from '@prism/sql/gameSchema/Vehicle.schema';

export class BackupService {
    private static async saveToS3(identifier: string, data: Object) {
        const bucket = 'immo-sql-user-backups';
        const objectName = `${identifier}.json`;
        const metadata = {
            'Content-Type': 'application/json',
        };
        try {
            return await S3Client.s3client.putObject(
                bucket,
                objectName,
                JSON.stringify(data),
                undefined,
                metadata,
            );
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    bucket,
                    objectName,
                    metadata,
                },
            });
            return undefined;
        }
    }

    public static async backupUser(identifier: string) {
        let dataToSave: {
            [key: string]: {
                [key: string]: any;
            };
        } = {};

        // Userdata
        const [userData] = await GameDB.query<RowDataPacket[]>(
            `SELECT * FROM users WHERE identifier = ?`,
            [identifier],
        );
        if (userData[0])
            dataToSave = {
                users: userData[0],
                ...dataToSave,
            };

        // Vehicle Data
        const [vehicleData] = await GameDB.query<IVehicle[]>(
            `SELECT * FROM owned_vehicles WHERE owner = ? AND job IS NULL`,
            [identifier],
        );
        if (vehicleData.length > 0)
            dataToSave = {
                ...dataToSave,
                owned_vehicles: vehicleData,
            };

        const plates = vehicleData.map((vehicle) => vehicle.plate);
        if (plates.length > 0) {
            const [undergroundData] = await GameDB.query<IUndergroundTuning[]>(
                `SELECT * FROM underground_tuning WHERE plate IN (?)`,
                [plates],
            );
            const undergroundBackup: IUndergroundTuning[] = [];
            if (undergroundData) {
                undergroundData.forEach((ug) => {
                    if (
                        ug.qAntilag ||
                        ug.qWegfahrsperre ||
                        ug.qFlamethrowerKit ||
                        ug.qRGBLightKit ||
                        ug.qLachgaseinspritzung ||
                        ug.qLachgasentluftung ||
                        ug.qRadarScrambler ||
                        ug.qLuftfahrwerk
                    )
                        undergroundBackup.push(ug);
                });
            }

            if (undergroundBackup) {
                dataToSave = {
                    ...dataToSave,
                    underground_tuning: undergroundBackup,
                };
            }
        }

        return this.saveToS3(identifier, dataToSave);
    }
}
