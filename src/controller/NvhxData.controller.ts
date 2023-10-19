import { GameDB } from '@sql/Database'
import { IItem } from '@sql/schema/Item.schema'
import { Cache } from '@utils/Cache'
import LogManager from '@utils/Logger'
import axios from 'axios'

/**
 * @description Class to get data from the NVHX API
 * @author mKpwnz
 * @date 19.10.2023
 * @export
 * @class NvhxData
 */
export class NvhxData {
    /**
     * @description Get all items from the NVHX API
     * @author mKpwnz
     * @date 18.10.2023
     * @static
     * @returns {*}  {Promise<String[]>}
     * @memberof NvhxData
     */
    public static async GetAllGlobalBans(): Promise<String[]> {
        var nvhxGlobalBans = await Cache.get<String[]>('nvhxGlobalBans')
        if (!nvhxGlobalBans) {
            var data = await axios.get('https://content.aniblur.games/ag/nvhx/gbn.txt')
            if (data.status == 200) {
                var nvhxResponse = data.data.split('\r\n')
                await Cache.set('nvhxGlobalBans', nvhxResponse)
                return nvhxResponse
            } else {
                LogManager.error('Error while fetching nvhx global bans')
                return []
            }
        }
        return nvhxGlobalBans
    }

    /**
     * @description Check if a user is banned on NVHX API (global bans) by his id
     * @author mKpwnz
     * @date 18.10.2023
     * @static
     * @param {string[]} userIds
     * @returns {*}  {Promise<boolean>}
     * @memberof NvhxData
     */
    public static async CheckIfUserIsBanned(userIds: string[]): Promise<boolean> {
        var nvhxGlobalBans = await NvhxData.GetAllGlobalBans()
        for (const id of userIds) {
            if (nvhxGlobalBans.indexOf(id) > -1) {
                return true
            }
        }
        return false
    }
}
