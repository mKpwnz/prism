"use strict";
/*import { Client } from 'discord.js'

export default (client: Client): void => {
    client.on('ready', async () => {
        if (!client.user || !client.application) {
            return
        }

        console.log(`${client.user.username} is online`)
    })
}*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.onReady = void 0;
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const _CommandList_1 = require("../commands/_CommandList");
const onReady = async (client) => {
    const rest = new rest_1.REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
    const commandData = _CommandList_1.CommandList.map((command) => command.data.toJSON());
    await rest.put(v9_1.Routes.applicationGuildCommands(client.user?.id || 'missing id', process.env.GUILD_ID), { body: commandData });
    console.log('Discord ready!');
};
exports.onReady = onReady;
