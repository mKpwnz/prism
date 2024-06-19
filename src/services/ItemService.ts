import { GameDB } from '@prism/sql/Database';
import { IItem } from '@prism/sql/gameSchema/Item.schema';
import { Cache } from '@prism/class/Cache';

export class ItemService {
    public static async getAllItems(): Promise<IItem[]> {
        const cItems = await Cache.get<IItem[]>('items');
        if (!cItems) {
            const [items] = await GameDB.query<IItem[]>(`SELECT * FROM items`);
            await Cache.set('items', items);
            return items;
        }
        return cItems;
    }

    public static async doesItemExists(itemName: string): Promise<boolean> {
        const items = await this.getAllItems();
        return items.some((item) => item.name === itemName);
    }

    public static async validateItemName(itemName: string): Promise<string> {
        const items = await this.getAllItems();
        return items.find((item) => item.name.toLowerCase() === itemName.toLowerCase())?.name ?? '';
    }
}
