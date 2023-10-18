import { ILivePlayer } from '@interfaces/ILivePlayer'
import { Cache } from '@utils/Cache'
import LogManager from '@utils/Logger'
import axios from 'axios'

/**
 * @author mKpwnz
 * @date 18.10.2023
 * @export
 * @class Player
 */
export class Player {
    /**
     * @description Get all live players from the server and cache them for 5 minutes.
     * @author mKpwnz
     * @date 18.10.2023
     * @static
     * @returns {*}  {Promise<ILivePlayer[]>}
     * @memberof Player
     */
    public static async getAllLivePlayers(): Promise<ILivePlayer[]> {
        var livePlayers = await Cache.get<ILivePlayer[]>('livePlayers')
        if (!livePlayers) {
            var data = await axios.get('http://gs01.immortaldev.eu:30120/players.json')
            if (data.status == 200) {
                await Cache.set('livePlayers', data.data, 5 * 60 * 1000)
                return data.data
            } else {
                LogManager.error('Error while fetching live players from server.')
                return []
            }
        }
        return livePlayers
    }
}
