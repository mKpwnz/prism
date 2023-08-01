"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openTicket = void 0;
const discord_js_1 = require("discord.js");
exports.openTicket = {
    data: new discord_js_1.SlashCommandBuilder().setName('openticket').setDescription('Open a ticket'),
    run: async (interaction) => {
        await interaction.reply('Ticket opened!');
        //await interaction.showModal(modal)
    },
};
