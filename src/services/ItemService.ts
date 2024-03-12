import { GameDB } from '@prism/sql/Database';
import { IItem } from '@prism/sql/gameSchema/Item.schema';
import { Cache } from '@prism/class/Cache';

/**
 * @description Service für Items.
 * @author mKpwnz
 * @date 14.10.2023
 * @export
 * @class ItemService
 */
export class ItemService {
    /**
     * @description Gibt alle Items zurück.
     * @author mKpwnz
     * @date 14.10.2023
     * @static
     * @returns {*}  {Promise<IItem[]>}
     * @memberof ItemService
     */
    public static async getAllItems(): Promise<IItem[]> {
        const cItems = await Cache.get<IItem[]>('items');
        if (!cItems) {
            const [items] = await GameDB.query<IItem[]>(`SELECT * FROM items`);
            await Cache.set('items', items);
            return items;
        }
        return cItems;
    }

    /**
     * @description
     * @author mKpwnz
     * @date 26.12.2023
     * @static
     * @param {string} itemName
     * @returns {*}  {Promise<boolean>}
     * @memberof ItemService
     */
    public static async doesItemExists(itemName: string): Promise<boolean> {
        const items = await this.getAllItems();
        return items.some((item) => item.name === itemName);
    }

    /**
     * @description
     * @author mKpwnz
     * @date 26.12.2023
     * @static
     * @param {string} itemName
     * @returns {*}  {Promise<string>}
     * @memberof ItemService
     */
    public static async validateItemName(itemName: string): Promise<string> {
        const items = await this.getAllItems();
        return items.find((item) => item.name.toLowerCase() === itemName.toLowerCase())?.name ?? '';
    }
}
