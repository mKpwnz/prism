import { ISchufaUser, ISchufaUserRaw } from '@prism/sql/schema/User.schema';
import { GameDB } from '@prism/sql/Database';

export class UserService {
    private static async parseSchufaUsers(users: ISchufaUserRaw[]): Promise<ISchufaUser[]> {
        const returnUsers: ISchufaUser[] = [];
        for (const user of users) {
            const accounts: {
                [key: string]: number;
            } = JSON.parse(user.accountsRaw);
            const negativesum = Object.values(accounts).reduce(
                (sum: number, value: number) => (value < 0 ? sum + value : sum),
                0,
            );
            returnUsers.push({
                firstname: user.firstname,
                lastname: user.lastname,
                steamId: user.steamId,
                accounts: {
                    bank: parseFloat(accounts.bank.toFixed(2)),
                    money: parseFloat(accounts.money.toFixed(2)),
                    black_money: parseFloat(accounts.black_money.toFixed(2)),
                    negativesum: parseFloat(negativesum.toFixed(2)),
                },
            });
        }
        return returnUsers.sort((a, b) => a.accounts.negativesum - b.accounts.negativesum);
    }

    public static async getSchufaHouseOwners(): Promise<ISchufaUser[]> {
        const [schufaHouseOwner] = await GameDB.query<ISchufaUserRaw[]>(
            `SELECT firstname, lastname, steamId, accounts as accountsRaw FROM users u JOIN player_houses ph ON u.identifier = ph.identifier WHERE JSON_EXTRACT(u.accounts, '$.bank') < 0;`,
        );
        return this.parseSchufaUsers(schufaHouseOwner);
    }

    public static async getSchufaUsers(): Promise<ISchufaUser[]> {
        const [schufaUsers] = await GameDB.query<ISchufaUserRaw[]>(
            `SELECT
                firstname,
                lastname,
                steamId,
                accounts as accountsRaw
            FROM
                users u
            WHERE
                JSON_EXTRACT(u.accounts, '$.bank') < 0
            OR
                JSON_EXTRACT(u.accounts, '$.black_money') < 0
            OR
                JSON_EXTRACT(u.accounts, '$.money') < 0;`,
        );
        return this.parseSchufaUsers(schufaUsers);
    }
}
