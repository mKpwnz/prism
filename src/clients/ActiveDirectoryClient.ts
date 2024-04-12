import Config from '@prism/Config';
import { Client, Control, DN, SearchOptions, SearchResult } from 'ldapts';

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
}

