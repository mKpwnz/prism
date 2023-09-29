import { IsUserAllowed } from '@proot/Helper'
import { CommandInteraction } from 'discord.js'

export abstract class Command {
    AllowedChannels: string[] = []
    AllowedGroups: string[] = []
    CheckPermissions: Boolean = false
    constructor(checkPermissions: boolean = false) {
        this.CheckPermissions = checkPermissions
    }
    abstract execute(interaction: CommandInteraction): Promise<void>
    async run(interaction: CommandInteraction): Promise<void> {
        if (this.CheckPermissions) {
            if ((await IsUserAllowed(interaction, this.AllowedChannels, this.AllowedGroups)) === false) return
        }

        await this.execute(interaction)
    }
}
