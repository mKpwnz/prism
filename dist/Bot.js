"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const CommandHandler_1 = require("./listeners/CommandHandler");
const ready_1 = require("./listeners/ready");
const dotenv = require('dotenv');
dotenv.config();
const token = process.env.DISCORD_TOKEN;
console.log('Bot is starting...');
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.IntentsBitField.Flags.GuildMembers,
        discord_js_1.IntentsBitField.Flags.Guilds,
        discord_js_1.IntentsBitField.Flags.GuildMessages,
    ],
});
client.on('ready', async () => await (0, ready_1.onReady)(client));
client.on('interactionCreate', async (interaction) => await (0, CommandHandler_1.onInteraction)(interaction));
client.login(token);
