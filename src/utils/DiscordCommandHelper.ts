import { ChatInputCommandInteraction } from 'discord.js';

export type SubCommandHandler = (interaction: ChatInputCommandInteraction) => Promise<void>;

export interface SubCommandMap {
    [key: string]: SubCommandHandler | SubCommandGroupMap;
}

export interface SubCommandGroupMap {
    [key: string]: SubCommandHandler;
}

async function defaultReply(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
        content: 'Command nicht gefunden.',
        ephemeral: true,
    });
}

export async function executeCommandFromMap(
    interaction: ChatInputCommandInteraction,
    commands: SubCommandMap,
): Promise<void> {
    const { options } = interaction;
    const subCommandGroup = options.getSubcommandGroup(false);
    const subCommand = options.getSubcommand(false);

    if (!subCommandGroup && !subCommand) {
        await defaultReply(interaction);
        return;
    }

    let command;

    if (subCommandGroup && commands[subCommandGroup]) {
        command = commands[subCommandGroup];
    } else if (subCommand && commands[subCommand]) {
        command = commands[subCommand];
    }

    if (!command) {
        await defaultReply(interaction);
        return;
    }

    if (typeof command === 'function') {
        await command(interaction);
        return;
    }

    if (subCommand) {
        const subCommandHandler = command[subCommand];

        if (typeof subCommandHandler === 'function') {
            await subCommandHandler(interaction);
        } else {
            await defaultReply(interaction);
        }
    } else {
        await defaultReply(interaction);
    }
}
