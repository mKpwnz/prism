import { GameDB } from '@sql/Database';
import { ISchufaUser } from '@sql/schema/User.schema';
import { IPhoneOwnerResponse } from '@sql/schema/Phone.schema';

export class GameDbService {
    public static async getSchufaUsers(): Promise<ISchufaUser[]> {
        const [schufaUsers] = await GameDB.query<ISchufaUser[]>(
            `SELECT firstname, lastname, steamId, accounts FROM users u JOIN player_houses ph ON u.identifier = ph.identifier WHERE JSON_EXTRACT(u.accounts, '$.bank') < 0;`,
        );

        return schufaUsers;
    }

    public static async getPhoneOwnerByImageLink(link: string): Promise<IPhoneOwnerResponse> {
        const [response] = await GameDB.query<IPhoneOwnerResponse[]>(
            `
                SELECT u.firstname,
                       u.lastname,
                       phones.id        AS steamID,
                       photos.phone_number,
                       photos.timestamp AS img_timestamp
                FROM phone_photos photos
                         JOIN phone_phones phones ON photos.phone_number = phones.phone_number
                         JOIN users u ON u.identifier = phones.id
                WHERE photos.link LIKE ?
                ORDER BY img_timestamp;
            `,
            [`%${link}%`],
        );
        return response[0];
    }
}
