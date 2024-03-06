// organize-imports-disable-next-line
import 'dotenv/config'; // THIS NEED TO BE AT THE TOP !!!IMPORTANT
import Config from '@prism/Config';
import { Cache } from '@prism/class/Cache';
import EventManager from '@prism/manager/EventManager';
import LogManager from '@prism/manager/LogManager';
import { Client, IntentsBitField, Partials } from 'discord.js';
import * as Sentry from '@sentry/node';

Sentry.init({
    dsn: 'https://f5d2f24f4aad4f35ed7524557e01b8ae@sentry.immortaldev.eu//2',
    environment: Config.ENV.NODE_ENV,
<<<<<<< 582a5877771c1f7b4b389574e21fcefc6a209b47
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
=======
    tracesSampleRate: 1.0,
>>>>>>> 8515f8c038e2cb52b08fc460cb14b8da20d75589
});

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
