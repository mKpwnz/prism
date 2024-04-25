import { BotClient } from '@prism/Bot';
import Config from '@prism/Config';
import { PlayerService } from '@prism/services/PlayerService';
import { ActivityType } from 'discord.js';

export async function botStatusUpdate() {
    if (!BotClient.user) return;
    const playerArray = await PlayerService.getAllLivePlayers();
    BotClient.user.setActivity({
        name: `${Config.Bot.CurrentVersion} | ${playerArray.length} Players Online`,
        type: ActivityType.Custom,
    });
}
