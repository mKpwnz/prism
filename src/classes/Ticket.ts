import { channel } from 'diagnostics_channel'
import { ChannelType, Guild, TextChannel } from 'discord.js'
export class Ticket {
    name: string
    description: string
    guild: Guild

    constructor(name: string, description: string, guild: Guild) {
        this.name = name
        this.description = description
        this.guild = guild
        this.createTicket()
    }

    async createTicket() {
        let tc: TextChannel
        let parent = await this.checkParent()
        console.log(parent)
        await this.guild.channels
            .create({
                name: this.name,
                type: ChannelType.GuildText,
                parent: parent,
            })
            .then((channel) => {
                tc = channel as TextChannel
            })
            .catch(console.error)
    }

    async checkParent() {
        let parent = this.guild.channels.cache.find((channel) => channel.name === 'Tickets')
        if (!parent) {
            await this.guild.channels
                .create({
                    name: 'Tickets',
                    type: ChannelType.GuildCategory,
                })
                .then((channel) => {
                    parent = channel
                })
        }
        return parent?.id
    }
}
