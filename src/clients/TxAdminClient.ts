import Config from '@Config';
import TxAdminError from '@error/TxAdmin.error';
import {
    TxAdminApiResponse,
    TxAdminDatabaseWhitelistRequestsType,
    TxAdminPlayerResponse,
} from '@interfaces/ITxAdmin';
import { IValidatedPlayer } from '@interfaces/IValidatedPlayer';
import LogManager from '@manager/LogManager';
import { isTxAdminPlayerResponse, isTxAdminWhitelistRequests } from '@utils/TxAdminHelper';
import axios from 'axios';

/**
 * @description TxAdminClient is a class to interact with the TxAdmin Backend.
 */
class TxAdminClient {
    private static instance: TxAdminClient;

    private static CsrfToken: string = '';

    private static sessionCookie: string = '';

    /**
     * @description Authenticates with the TxAdmin Backend and sets the sessionCookie and csrfToken for the TxAdminClient instance.
     *
     * **DO NOT USE THIS METHOD DIRECTLY! Use getInstance() instead.**
     *
     * Authentication is handled automatically via CronJob in Bot.ts
     */
    public static async authenticate() {
        const response = await axios.post(
            `${Config.ENV.TX_ADMIN_ENDPOINT}auth/password?uiVersion=${Config.ENV.TX_ADMIN_VERSION}`,
            {
                username: Config.ENV.TX_ADMIN_USER,
                password: Config.ENV.TX_ADMIN_PASS,
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

        TxAdminClient.sessionCookie = sessionCookie;
        TxAdminClient.CsrfToken = data.csrfToken;
    }

    public static async getPlayerInfo(
        player: IValidatedPlayer,
    ): Promise<TxAdminPlayerResponse | TxAdminError> {
        const response = await axios.get(
            `${Config.ENV.TX_ADMIN_ENDPOINT}player?license=${
                player.identifiers.license.split(':')[1]
            }`,
            TxAdminClient.getTxAdminRequestConfig(),
        );

        if (!isTxAdminPlayerResponse(response.data)) {
            return new TxAdminError(response.data.error);
        }
        return response.data;
    }

    public static async getWhitelistRequestById(
        requestid: string,
    ): Promise<TxAdminDatabaseWhitelistRequestsType | null> {
        const response = await axios.get(
            `${Config.ENV.TX_ADMIN_ENDPOINT}whitelist/requests?searchString=${requestid}`,
            TxAdminClient.getTxAdminRequestConfig(),
        );
        if (!isTxAdminWhitelistRequests(response.data)) {
            LogManager.error(response.data);
            return null;
        }

        LogManager.debug(response.data.requests);

        return response.data.requests.find((r) => r.id === requestid) ?? null;
    }

    /**
     * @description Method to approve or deny a whitelist request by id.
     */
    public static async handleWhitelistRequest(
        requestId: string,
        status: 'approve' | 'deny',
    ): Promise<boolean | TxAdminError> {
        const response = await axios.post(
            `${Config.ENV.TX_ADMIN_ENDPOINT}whitelist/requests/${status}`,
            { reqId: requestId },
            TxAdminClient.getTxAdminRequestConfig(),
        );
        if (!response.data.success) {
            return new TxAdminError(response.data.error);
        }
        return true;
    }

    /**
     * @description Method to set the whitelist status of a player.
     */
    public static async playerSetWhitelist(
        player: IValidatedPlayer,
        status: boolean,
    ): Promise<boolean | TxAdminError> {
        const response = await TxAdminClient.playerAction('whitelist', player, { status });
        if (response instanceof TxAdminError) return response;
        return response.success;
    }

    public static async playerWarn(
        player: IValidatedPlayer,
        reason: string,
    ): Promise<string | TxAdminError> {
        const response = await TxAdminClient.playerAction('warn', player, { reason });
        if (response instanceof TxAdminError) return response;
        if (!response?.actionId) return new TxAdminError("Couldn't get actionId from response!");
        return response.actionId;
    }

    public static async playerKick(
        player: IValidatedPlayer,
        reason: string,
    ): Promise<string | TxAdminError> {
        const response = await TxAdminClient.playerAction('kick', player, { reason });
        if (response instanceof TxAdminError) return response;
        if (!response?.actionId) return new TxAdminError("Couldn't get actionId from response!");
        return response.actionId;
    }

    public static async playerMessage(
        player: IValidatedPlayer,
        message: string,
    ): Promise<boolean | TxAdminError> {
        const response = await TxAdminClient.playerAction('message', player, { message });
        if (response instanceof TxAdminError) return response;
        return response.success;
    }

    public static async playerSaveNote(
        player: IValidatedPlayer,
        note: string,
    ): Promise<boolean | TxAdminError> {
        const response = await TxAdminClient.playerAction('save_note', player, { note });
        if (response instanceof TxAdminError) return response;
        return response.success;
    }

    public static async playerBan(
        player: IValidatedPlayer,
        reason: string,
        duration: string,
    ): Promise<string | TxAdminError> {
        const response = await TxAdminClient.playerAction('ban', player, { reason, duration });
        if (response instanceof TxAdminError) return response;
        if (!response?.actionId) return new TxAdminError("Couldn't get actionId from response!");
        return response.actionId;
    }

    private static getTxAdminRequestConfig() {
        return {
            headers: {
                Cookie: `${this.sessionCookie};`,
                'X-TXADMIN-CSRFTOKEN': this.CsrfToken,
            },
        };
    }

    private static async playerAction(
        endpoint: string,
        player: IValidatedPlayer,
        requestBody: object,
    ): Promise<TxAdminApiResponse | TxAdminError> {
        const response = await axios.post(
            `${Config.ENV.TX_ADMIN_ENDPOINT}player/${endpoint}?license=${
                player.identifiers.license.split(':')[1]
            }`,
            requestBody,
            TxAdminClient.getTxAdminRequestConfig(),
        );
        if (!response.data.success) {
            return new TxAdminError(response.data.error);
        }
        return response.data as TxAdminApiResponse;
    }
}

export default TxAdminClient;

