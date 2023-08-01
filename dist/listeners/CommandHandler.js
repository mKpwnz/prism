"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInteraction = void 0;
const _CommandList_1 = require("../commands/_CommandList");
const onInteraction = async (interaction) => {
    if (!interaction.isCommand())
        return;
    for (const command of _CommandList_1.CommandList) {
        if (interaction.commandName === command.data.name) {
            await command.run(interaction);
            break;
        }
    }
};
exports.onInteraction = onInteraction;
