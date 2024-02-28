import { CronJob } from 'cron';
import LogManager from './LogManager';

/**
 * @description CronManager is a class to manage all crons in the bot.
 * @author mKpwnz
 * @date 20.10.2023
 * @export
 * @class CronManager
 */
export class CronManager {
    private static crons: Map<string, CronJob>;

    /**
     * @description
     * @author mKpwnz
     * @date 20.10.2023
     * @static
     * @param {{ [key: string]: CronJob }} initCronMap
     * @memberof CronManager
     */
    public static initCronManager(initCronMap: { [key: string]: CronJob }) {
        CronManager.crons = new Map<string, CronJob>();
        LogManager.info('CronManager is starting...');
        Object.keys(initCronMap).forEach((key) => {
            CronManager.addCron(key, initCronMap[key]);
            LogManager.info(`CronManager added: ${key}`);
        });
        LogManager.info('CronManager is ready!');
    }

    /**
     * @description Starts all crons in the crons map object.
     * @author mKpwnz
     * @date 20.10.2023
     * @static
     * @memberof CronManager
     */
    public static startAll(): void {
        CronManager.crons.forEach((cron) => {
            cron.start();
        });
    }

    /**
     * @description Stops all crons in the crons map object. This will not remove the crons from the map object.
     * @author mKpwnz
     * @date 20.10.2023
     * @static
     * @memberof CronManager
     */
    public static stopAll(): void {
        CronManager.crons.forEach((cron) => {
            cron.stop();
        });
    }

    /**
     * @description Returns all crons as a map<string, CronJob> object
     * @author mKpwnz
     * @date 20.10.2023
     * @static
     * @returns {*}  {Map<string, CronJob>}
     * @memberof CronManager
     */
    public static getCrons(): Map<string, CronJob> {
        return CronManager.crons;
    }

    /**
     * @description
     * @author mKpwnz
     * @date 20.10.2023
     * @static
     * @param {string} name
     * @param {CronJob} cron
     * @memberof CronManager
     */
    public static addCron(name: string, cron: CronJob) {
        if (CronManager.crons.has(name)) {
            CronManager.crons.get(name)?.stop();
        }
        CronManager.crons.set(name, cron);
        CronManager.crons.get(name)?.start();
    }

    /**
     * @description Removes a cron by name
     * @author mKpwnz
     * @date 20.10.2023
     * @static
     * @param {string} name
     * @memberof CronManager
     */
    public static removeCronByName(name: string) {
        if (CronManager.crons.has(name)) {
            CronManager.crons.get(name)?.stop();
            CronManager.crons.delete(name);
        }
    }
}
