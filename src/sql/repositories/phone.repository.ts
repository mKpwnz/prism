import { IPhoneOwnerResponse } from '@sql/schema/Phone.schema';
import { GameDB } from '@sql/Database';

export class PhoneRepository {
    public static async getPhoneOwnerByImageLink(
        link: string,
    ): Promise<IPhoneOwnerResponse | undefined> {
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
