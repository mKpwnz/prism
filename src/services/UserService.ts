import { ISchufaUser } from '@sql/schema/User.schema';
import { GameDB } from '@sql/Database';

export class UserService {
    public static async getSchufaUsers(): Promise<ISchufaUser[]> {
        const [schufaUsers] = await GameDB.query<ISchufaUser[]>(
            `SELECT firstname, lastname, steamId, accounts FROM users u JOIN player_houses ph ON u.identifier = ph.identifier WHERE JSON_EXTRACT(u.accounts, '$.bank') < 0;`,
        );

        return schufaUsers;
    }
}
