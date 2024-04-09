import { BotClient } from '@prism/Bot';
import { PlayerService } from '@prism/services/PlayerService';
import { ActivityType } from 'discord.js';

export async function botStatusUpdate() {
    if (!BotClient.user) return;
    const playerArray = await PlayerService.getAllLivePlayers();
    BotClient.user.setActivity({
        name: `${playerArray.length} Players Online`,
        type: ActivityType.Custom,
    });
}

