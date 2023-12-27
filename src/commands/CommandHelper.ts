import { ChatInputCommandInteraction } from 'discord.js';
import LogManager from '@utils/Logger';

export class CommandHelper {
    // @TODO Is this method necessary? @see Comamnd.ts#L:196
    public static async handleInteractionError(
        error: any,
        interaction: ChatInputCommandInteraction,
    ): Promise<void> {
        LogManager.error(error);
        await interaction.reply({
            content: `Fehler beim Ausführen des Befehls:\`\`\`json${JSON.stringify(error)}\`\`\``,
            ephemeral: true,
        });
    }
}
