import { RconClient } from '@prism/class/RconClient';
import { GameDB } from '@prism/sql/Database';
import { ResultSetHeader } from 'mysql2';
import { IJob } from '../sql/schema/Job.schema';
import { ItemService } from './ItemService';

export class FraktionService {
    public static async addItem(fraktion: string, item: string, count: number): Promise<boolean> {
        if (!(await ItemService.doesItemExists(item))) return false;

        const [job] = await GameDB.query<IJob[]>(`SELECT * FROM jobs WHERE name = ?`, [fraktion]);

        if (!job[0]) return false;

        let armory = JSON.parse(job[0].armory);

        if (!armory) armory = {};

        if (!armory[item]) armory[item] = 0;

        armory[item] += count;

        const [result] = await GameDB.query<ResultSetHeader>(
            `UPDATE jobs SET armory = ? WHERE name = ?`,
            [JSON.stringify(armory), fraktion],
        );

        if (result.affectedRows === 0) {
            return false;
        }

        await RconClient.sendCommand(`debugarmory ${fraktion}`);

        return true;
    }

    public static async addWeapon(
        fraktion: string,
        weapon: string,
        count: number,
    ): Promise<boolean> {
        const [job] = await GameDB.query<IJob[]>(`SELECT * FROM jobs WHERE name = ?`, [fraktion]);

        if (!job[0]) return false;

        let armory = JSON.parse(job[0].armory);

        if (!armory) armory = {};

        if (!armory.weapon_weapons) armory.weapon_weapons = {};

        for (let i = 0; i < count; i++) {
            armory.weapon_weapons.push({ w: weapon, c: 300 });
        }

        const [result] = await GameDB.query<ResultSetHeader>(
            `UPDATE jobs SET armory = ? WHERE name = ?`,
            [JSON.stringify(armory), fraktion],
        );

        if (result.affectedRows === 0) {
            return false;
        }

        await RconClient.sendCommand(`debugarmory ${fraktion}`);

        return true;
    }

    public static async clearArmory(fraktion: string): Promise<boolean> {
        const [result] = await GameDB.query<ResultSetHeader>(
            `UPDATE jobs SET armory = ? WHERE name = ?`,
            [JSON.stringify({}), fraktion],
        );

        if (result.affectedRows === 0) {
            return false;
        }

        await RconClient.sendCommand(`debugarmory ${fraktion}`);

        return true;
    }

    public static async clearPlayerArmory(fraktion: string, identifier: string): Promise<boolean> {
        const [result] = await GameDB.query<ResultSetHeader>(
            `UPDATE jobs_player_armory SET armory = ? WHERE identifier = ? AND job = ?`,
            [JSON.stringify({}), identifier, fraktion],
        );

        if (result.affectedRows === 0) {
            return false;
        }

        return true;
    }
}
