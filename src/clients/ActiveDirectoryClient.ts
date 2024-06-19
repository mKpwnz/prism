import Config from '@prism/Config';
import { Client, Control, DN, SearchOptions, SearchResult } from 'ldapts';
import { IADUser } from '@prism/interfaces/IActiveDirectory';

export default class ActiveDirectoryClient {
    public static client: Client;

    private static async createClient(): Promise<void> {
        if (!this.client) {
            this.client = new Client({
                url: Config.ENV.LDAP_SERVER,
            });
        }

        await this.client.bind(Config.ENV.LDAP_BINDDN, Config.ENV.LDAP_PASSWORD);
    }

    public static async search(
        baseDN: DN | string,
        options?: SearchOptions,
        controls?: Control | Control[],
    ): Promise<SearchResult> {
        await this.createClient();
        const response = await this.client.search(baseDN, options, controls);
        await this.client.unbind();
        return response;
    }

    public static async getUserByDiscordId(user: string): Promise<IADUser | Error> {
        const { searchEntries } = await ActiveDirectoryClient.search(
            'OU=Benutzer,DC=immortaldev,DC=eu',
            {
                scope: 'sub',
                filter: `(&(objectclass=person)(userDiscordId=${user}))`,
                attributes: [
                    'cn',
                    'distinguishedName',
                    'sAMAccountName',
                    'userPrincipalName',
                    'mail',
                    'userDiscordId',
                    'userSteamId',
                    'memberOf',
                    'msExchHomeServerName',
                ],
            },
        );

        if (searchEntries.length === 0) return new Error('User not found');
        if (searchEntries.length > 1) return new Error('Multiple users found');

        const seUser = searchEntries[0];
        const memberOfpretty: string[] = [];
        if (Array.isArray(seUser.memberOf)) {
            seUser.memberOf.forEach((group) => {
                if (typeof group === 'string')
                    memberOfpretty.push(group.split(',')[0].split('=')[1]);
            });
        }

        return {
            dn: seUser.dn,
            cn: seUser.cn as string,
            distinguishedName: seUser.distinguishedName as string,
            sAMAccountName: seUser.sAMAccountName as string,
            userPrincipalName: seUser.userPrincipalName as string,
            mail: seUser.mail as string,
            userDiscordId: seUser.userDiscordId as string,
            userSteamId: seUser.userSteamId as string,
            memberOf: (seUser.memberOf as string[]).sort(),
            memberOfpretty: memberOfpretty.sort(),
            msExchHomeServerName: seUser.msExchHomeServerName as string,
        };
    }
}
