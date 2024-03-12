import Config from '@prism/Config';
import LogManager from '@prism/manager/LogManager';
import { PlayerService } from '@prism/services/PlayerService';
import { BotDB } from '@prism/sql/Database';
import { playerCount } from '@prism/sql/botSchema/BotSchema';

export async function logPlayerCount() {
    if (Config.ENV.NODE_ENV !== 'production') {
        LogManager.debug('CronJobs: logPlayerCount() will only execute in production.');
        return;
    }
    const playerArray = await PlayerService.getAllLivePlayers();
    await BotDB.insert(playerCount).values({ count: playerArray.length });
    LogManager.debug('CronJobs: logPlayerCount() done.');
}
