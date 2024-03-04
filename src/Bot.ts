// organize-imports-disable-next-line
import 'dotenv/config'; // THIS NEED TO BE AT THE TOP !!!IMPORTANT
import Config from '@prism/Config';
import { Cache } from '@prism/class/Cache';
import EventManager from '@prism/manager/EventManager';
import LogManager from '@prism/manager/LogManager';
import { Client, IntentsBitField, Partials } from 'discord.js';

LogManager.configure();
LogManager.info('Bot is starting...');

const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

Cache.init();
EventManager.init(client);
client.login(Config.ENV.DISCORD_TOKEN);

export const BotClient = client;
