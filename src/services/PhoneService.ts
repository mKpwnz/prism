import { IPhone, IPhone_SQL_MediaCreatorResponse } from '@prism/sql/gameSchema/Phone.schema';
import { GameDB } from '@prism/sql/Database';
import { ResultSetHeader } from 'mysql2';
import { IValidatedPlayer } from '@prism/typings/interfaces/IValidatedPlayer';

export class PhoneService {
    public static async getMediaCreatorByLink(
        link: string,
    ): Promise<IPhone_SQL_MediaCreatorResponse | undefined> {
        const [response] = await GameDB.query<IPhone_SQL_MediaCreatorResponse[]>(
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

    public static async getCurrentPhonePin(
        player: IValidatedPlayer,
    ): Promise<string | null | Error> {
        const [phones] = await GameDB.query<IPhone[]>('SELECT * FROM phone_phones WHERE id = ?', [
            player.identifiers.steam,
        ]);
        if (!phones || phones.length === 0) {
            return new Error(
                `Es konnte kein Handy für den Spieler ${player.playerdata.fullname} gefunden werden.`,
            );
        }
        return phones[0].pin;
    }

    public static async deletePhoneByIdentifier(identifier: string): Promise<boolean> {
        const [result] = await GameDB.query<ResultSetHeader>(
            'DELETE FROM phone_phones WHERE id = ?',
            [identifier],
        );
        return result.affectedRows > 0;
    }

    public static async getPhoneDataByPlayer(player: IValidatedPlayer): Promise<IPhone | Error> {
        return new Error('Not implemented yet');
    }
}
