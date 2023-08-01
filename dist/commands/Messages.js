"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.message = void 0;
const axios_1 = require("axios");
const discord_js_1 = require("discord.js");
let imageid = 0;
const fs = require('fs');
exports.message = {
    data: new discord_js_1.SlashCommandBuilder().setName('scanmessages').setDescription('Grab all messages'),
    run: async (interaction) => {
        const { channel, options } = interaction;
        const time = Date.now() - 1000 * 60 * 60 * 24 * 14;
        if (channel instanceof discord_js_1.TextChannel) {
            let hasMessages = true;
            let before = null;
            while (hasMessages) {
                const response = await fetchMessage(channel, 100, before);
                if (response) {
                    before = response;
                }
                else {
                    hasMessages = false;
                }
            }
            await interaction.reply('Messages logged in console.');
        }
        else {
            console.error('Dieser Command kann nur in Textchannels verwendet werden.');
            console.log('Channel: ', channel);
            await interaction.reply('Dieser Command kann nur in Textchannels verwendet werden.');
        }
    },
};
async function fetchMessage(channel, limit, before) {
    let messages;
    let size = 0;
    if (before != null) {
        messages = await channel.messages.fetch({ limit: limit, before: before });
    }
    else {
        messages = await channel.messages.fetch({ limit: limit });
    }
    let lastMessage = messages.last()?.id;
    //log messages in console
    messages.forEach((message) => {
        //console.log(message.content)
        if (message.attachments.size > 0) {
            size += message.attachments.size;
            message.attachments.forEach((attachment) => {
                //console.log(attachment.url)
                downloadPicture(attachment.url, imageid);
                imageid++;
            });
        }
        if (message.embeds.length > 0) {
            message.embeds.forEach((embed) => {
                if (embed.image) {
                    //console.log(embed.image.url)
                    downloadPicture(embed.image.url, imageid);
                    imageid++;
                }
            });
        }
    });
    console.log('Message-Size: ' + messages.size);
    console.log('Last Message: ' + lastMessage);
    console.log('Attachment-Size: ' + size);
    console.log(messages.size < 100 ? null : lastMessage);
    return messages.size < 100 ? null : lastMessage;
}
async function downloadPicture(url, id) {
    const response = await axios_1.default.get(url, { responseType: 'arraybuffer' }); // Verwende axios statt fetch
    fs.writeFile('pictures/' + id + '.png', response.data, () => { });
}
