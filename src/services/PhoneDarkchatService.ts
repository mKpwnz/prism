import { GameDB } from '@sql/Database';
import { IPhoneDarkchatSearch } from '@sql/schema/Phone.schema';
import { ResultSetHeader } from 'mysql2';

export class PhoneDarkchatService {
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

    public static async getMessages(
        filterBy: string,
        filterValue: string,
        dateFrom: string | null,
        dateTo: string | null,
    ): Promise<IPhoneDarkchatSearch[]> {
        let to = new Date('1970-01-01 00:00:00');
        let from = new Date();

        let filterCondition = '';
        switch (filterBy) {
            case 'byChannel':
                filterCondition = 'AND m.channel = ?;';
                break;
            case 'bySteamID':
                filterCondition = 'AND p.id = ?;';
                break;
            case 'byPhoneNumber':
                filterCondition = 'AND a.phone_number = ?;';
                break;
            case 'byDarkchatName':
                filterCondition = 'AND m.sender = ?;';
                break;
            default:
                filterCondition = ';';
                break;
        }

        if (dateFrom) from = new Date(dateFrom);
        if (dateTo) to = new Date(dateTo);

        const [messages] = await GameDB.query<IPhoneDarkchatSearch[]>(
            `
		SELECT
			m.id as msgID,
			m.channel,
			m.sender,
			a.phone_number,
			p.id as steamID,
			m.content,
			m.timestamp
		FROM
			phone_darkchat_messages m
		JOIN
			phone_darkchat_accounts a ON m.sender = a.username
		JOIN
			phone_phones p ON a.phone_number = p.phone_number
		WHERE
			m.timestamp >= '${to.toISOString().slice(0, 19).replace('T', ' ')}'
			AND m.timestamp <= '${from.toISOString().slice(0, 19).replace('T', ' ')}'
			${filterCondition}
		`,
            [filterValue],
        );
        return messages;
    }
}
