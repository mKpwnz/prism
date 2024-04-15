// organize-imports-disable-next-line
import 'dotenv/config'; // THIS NEED TO BE AT THE TOP !!!IMPORTANT
import Config from '@prism/Config';
import { Cache } from '@prism/class/Cache';
import EventManager from '@prism/manager/EventManager';
import LogManager from '@prism/manager/LogManager';
import { InitDatabase } from '@prism/sql/Database';
import * as SentryNode from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Client, IntentsBitField, Partials } from 'discord.js';

SentryNode.init({
    dsn: Config.ENV.SENTRY_DSN,
    environment: Config.ENV.NODE_ENV,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    integrations: [nodeProfilingIntegration()],
});

LogManager.configure();
LogManager.info('Bot is starting...');

InitDatabase();

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
client.login(Config.ENV.DISCORD_TOKEN);
EventManager.init(client);

export const BotClient = client;
export const Sentry = SentryNode;

