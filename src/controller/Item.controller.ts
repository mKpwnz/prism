import { GameDB } from '@sql/Database'
import { IItem } from '@sql/schema/Item.schema'
import { Cache } from '@utils/Cache'

/**
 * @description Controller für Items.
 * @author mKpwnz
 * @date 14.10.2023
 * @export
 * @class Items
 */
export class Items {
    /**
     * @description Gibt alle Items zurück.
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @returns {*}  {Promise<IItem[]>}
     * @memberof Items
     */
    public static async getAllItems(): Promise<IItem[]> {
        var cItems = await Cache.get<IItem[]>('items')
        if (!cItems) {
            var [items] = await GameDB.query<IItem[]>(`SELECT * FROM items`)
            await Cache.set('items', items)
            return items
        }
        return cItems
    }
}
