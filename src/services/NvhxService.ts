<<<<<<< af8577b6b8a36041add23243c245e5c114e314b8
import { Sentry } from '@prism/Bot';
=======
>>>>>>> 292f09d6afe23dd9b8daff8eb9af9dfc7b7be462
import { Cache } from '@prism/class/Cache';
import LogManager from '@prism/manager/LogManager';
import axios from 'axios';

/**
 * @description Class to get data from the NVHX API
 * @author mKpwnz
 * @date 19.10.2023
 * @export
 * @class NvhxService
 */
export class NvhxService {
    /**
     * @description Get all items from the NVHX API
     * @author mKpwnz
     * @date 18.10.2023
     * @static
     * @returns {*}  {Promise<Set<String>>}
     * @memberof NvhxService
     */
    public static async GetAllGlobalBans(): Promise<Set<string>> {
        let bans = await Cache.get<Set<string>>('nvhxGlobalBans');
        if (!bans) {
            try {
                const response = await axios.get(
                    'https://content____________.aniblur.games/ag/nvhx/gbn.txt',
                );
                if (response.status === 200 && response.data) {
                    bans = new Set(response.data.split('\r\n'));
                    await Cache.set('nvhxGlobalBans', bans);
                } else {
                    LogManager.error(
                        'Non-200 status code received while fetching NVHX global bans',
                    );
                }
            } catch (error: any) {
<<<<<<< af8577b6b8a36041add23243c245e5c114e314b8
                Sentry.captureException(error);
=======
>>>>>>> 292f09d6afe23dd9b8daff8eb9af9dfc7b7be462
                LogManager.error(`Error while fetching NVHX global bans: ${error.message}`);
            }
        }
        return bans ?? new Set();
    }

    /**
     * @description Check if a user is banned on NVHX API (global bans) by his id
     * @author mKpwnz
     * @date 18.10.2023
     * @static
     * @param {string[]} userIds
     * @param globalBans
     * @returns {*}  {Promise<boolean>}
     * @memberof NvhxService
     */
    public static async CheckIfUserIsBanned(userIds: string[]): Promise<boolean> {
        const globalBans = await this.GetAllGlobalBans();
        return userIds.some((id) => globalBans.has(id));
    }
}
