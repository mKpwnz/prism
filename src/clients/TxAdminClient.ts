import LogManager from '@utils/Logger';
import axios from 'axios';
import util from 'util';

type TxAdminBanRequest = {
    reason: string;
    duration: string;
    identifiers: string[];
};

type TxAdminResponse = {
    success: boolean;
    data: object | null;
};

// TODO whitelist got the following methods: add, remove, approve, deny, deny_all
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

    private getTxAdminConfig() {
        return {
            headers: {
                Cookie: `${this.sessionCookie};`,
                'X-TXADMIN-CSRFTOKEN': this.CsrfToken,
            },
        };
    }

    private getTxAdminResponse(response: any, message: string): TxAdminResponse {
        const { data } = response;

        if (data.success) {
            return { success: true, data };
        }
        LogManager.error(`[TxAdminClient] ${message}: ${util.inspect(data)}`);
        return { success: false, data: null };
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

    // It should be possible to ban multiple players at once, but i still need to check this
    public async banIds(request: TxAdminBanRequest): Promise<TxAdminResponse> {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}database/ban_ids`,
            request,
            this.getTxAdminConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while banning by ids');
    }

    public async whitelistRequestSet(requestId: string, status: boolean): Promise<TxAdminResponse> {
        const action = status ? 'approve' : 'deny';

        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}whitelist/requests/${action}`,
            { reqId: requestId },
            this.getTxAdminConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while setting whitelist request status');
    }

    public async playerSetWhitelist(license: string, status: boolean): Promise<TxAdminResponse> {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}player/whitelist?license=${license}`,
            { status },
            this.getTxAdminConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while setting player whitelist status');
    }

    public async playerWarn(license: string, reason: string): Promise<TxAdminResponse> {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}player/warn?license=${license}`,
            { reason },
            this.getTxAdminConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while warning player');
    }

    public async playerKick(license: string, reason: string): Promise<TxAdminResponse> {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}player/warn?license=${license}`,
            { reason },
            this.getTxAdminConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while warning player');
    }

    public async playerMessage(license: string, message: string): Promise<TxAdminResponse> {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}player/message?license=${license}`,
            { message },
            this.getTxAdminConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while messaging player');
    }

    public async playerSaveNote(license: string, note: string): Promise<TxAdminResponse> {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}player/save_note?license=${license}`,
            { note },
            this.getTxAdminConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while saving note for player');
    }

    public async playerBan(
        license: string,
        reason: string,
        duration: string,
    ): Promise<TxAdminResponse> {
        const response = await axios.post(
            `${process.env.TX_ADMIN_ENDPOINT}player/warn?license=${license}`,
            { reason, duration },
            this.getTxAdminConfig(),
        );

        return this.getTxAdminResponse(response, 'Error while banning player');
    }
}

export { TxAdminBanRequest, TxAdminClient };
