import { IPhoneOwnerResponse } from '@prism/sql/schema/Phone.schema';
import { GameDB } from '@prism/sql/Database';
import { ResultSetHeader } from 'mysql2';

export class PhoneService {
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

    /**
     * @description Deletes a phone from the database by the identifier.
     * @static
     * @param {string} identifier - The identifier of the phone to be deleted.
     * @returns {Promise<boolean>} A Promise that resolves to true if the phone was successfully deleted, or false otherwise.
     * @memberof PhoneService
     */
    public static async deletePhoneByIdentifier(identifier: string): Promise<boolean> {
        const [result] = await GameDB.query<ResultSetHeader>(
            'DELETE FROM phone_phones WHERE identifier = ?',
            [identifier],
        );
        return result.affectedRows > 0;
    }
}
