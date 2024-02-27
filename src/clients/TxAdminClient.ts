import LogManager from '@utils/Logger';
import axios, { AxiosResponse } from 'axios';
import util from 'util';
import { IValidatedPlayer } from '@interfaces/IValidatedPlayer';

type TxAdminResponse = {
    success: boolean;
    data: object | null;
};

/**
 * @description TxAdminClient is a class to interact with the TxAdmin Backend.
 */
class TxAdminClient {
    private static instance: TxAdminClient;

    private CsrfToken: string = '';

    private sessionCookie: string = '';

    private constructor() {
        // private constructor, use getInstance() instead
    }

    private getTxAdminRequestConfig() {
        return {
            headers: {
                Cookie: `${this.sessionCookie};`,
                'X-TXADMIN-CSRFTOKEN': this.CsrfToken,
            },
        };
    }

    private getTxAdminResponse(
        response: AxiosResponse<any, any>,
        errorMessage: string,
    ): TxAdminResponse {
        const { data } = response;

        if (data.success) {
            return { success: true, data };
        }
        LogManager.error(`[TxAdminClient] ${errorMessage}: ${util.inspect(data)}`);
        return { success: false, data: null };
    }

    private async playerAction(
        endpoint: string,
        player: IValidatedPlayer,
        data: any,
    ): Promise<TxAdminResponse> {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}player/${endpoint}?license=${player.identifiers.license.split(':')[1]}`,
            data,
            this.getTxAdminRequestConfig(),
        );

        return this.getTxAdminResponse(response, `Error while calling ${endpoint} for player`);
    }

    public static async getInstance(): Promise<TxAdminClient> {
        if (!TxAdminClient.instance) {
            const client = new TxAdminClient();
            await client.authenticate();
            TxAdminClient.instance = client;
        }
        return TxAdminClient.instance;
    }

    /**
     * @description Authenticates with the TxAdmin Backend and sets the sessionCookie and csrfToken for the TxAdminClient instance.
     *
     * **DO NOT USE THIS METHOD DIRECTLY! Use getInstance() instead.**
     *
     * Authentication is handled automatically via CronJob in Bot.ts
     */
    public async authenticate() {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}auth/password?uiVersion=${process.env.TX_ADMIN_VERSION}`,
            {
                username: process.env.TX_ADMIN_USER,
                password: process.env.TX_ADMIN_PASS,
            },
        );
        const { data } = response;

        // might break if multiple cookies are set in the future
        // We could use https://www.npmjs.com/package/set-cookie-parser instead, for better validation
        const sessionCookie = response.headers['set-cookie']?.[0]?.split(';')[0];
        if (!sessionCookie) {
            throw new Error('[TxAdminClient] Did not receive sessionCookie from TxAdmin!');
        }

        const { csrfToken } = response.data;
        if (!csrfToken) {
            throw new Error('[TxAdminClient] Did not receive csrfToken from TxAdmin!');
        }

        this.sessionCookie = sessionCookie;
        this.CsrfToken = data.csrfToken;
    }

    /**
     * @description Method to approve or deny a whitelist request by id.
     * @param requestId - The id of the whitelist request
     * @param status - The status to set the whitelist request to. `true` for approve, `false` for deny.
     */
    public async whitelistRequestSet(requestId: string, status: boolean): Promise<TxAdminResponse> {
        const action = status ? 'approve' : 'deny';

        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}whitelist/requests/${action}`,
            { reqId: requestId },
            this.getTxAdminRequestConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while setting whitelist request status');
    }

    /**
     * @description Method to set the whitelist status of a player.
     */
    public async playerSetWhitelist(
        player: IValidatedPlayer,
        status: boolean,
    ): Promise<TxAdminResponse> {
        return this.playerAction('whitelist', player, { status });
    }

    public async playerWarn(player: IValidatedPlayer, reason: string): Promise<TxAdminResponse> {
        return this.playerAction('warn', player, { reason });
    }

    public async playerKick(player: IValidatedPlayer, reason: string): Promise<TxAdminResponse> {
        return this.playerAction('kick', player, { reason });
    }

    public async playerMessage(
        player: IValidatedPlayer,
        message: string,
    ): Promise<TxAdminResponse> {
        return this.playerAction('message', player, { message });
    }

    public async playerSaveNote(player: IValidatedPlayer, note: string): Promise<TxAdminResponse> {
        return this.playerAction('save_note', player, { note });
    }

    public async playerBan(player: IValidatedPlayer, reason: string, duration: string) {
        return this.playerAction('ban', player, { reason, duration });
    }
}

export default TxAdminClient;
