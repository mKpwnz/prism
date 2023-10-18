import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import { Items } from '@controller/Item.controller'
import { NvhxData } from '@controller/NvhxData.controller'
import Config from '@proot/Config'
import { IItem } from '@sql/schema/Item.schema'
import { Cache } from '@utils/Cache'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export class CachePerformance extends Command {
    constructor() {
        super()
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = [Config.Discord.Groups.DEV_SERVERENGINEER, Config.Discord.Groups.DEV_BOTTESTER]
        RegisterCommand(
            new SlashCommandBuilder().setName('cacheperformance').setDescription('Performance Test für den Cache.'),
            this,
        )
        this.DoNotCountUse = true
    }
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await Cache.testPerformance(
            interaction,
            async () => {
                var data = await NvhxData.GetAllGlobalBans()
                console.log(data)
            },
            'items',
        )
    }
}
