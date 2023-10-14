import { GameDB } from '@sql/Database'
import { IItem } from '@sql/schema/Item.schema'
import { Cache } from '@utils/Cache'

export class Items {
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
