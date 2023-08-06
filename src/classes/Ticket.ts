import { ChannelType, Guild, PermissionFlagsBits, TextChannel } from 'discord.js'
export class Ticket {
    name: string
    description: string
    guild: Guild
    ticketowner: string
    id: string | null = null
    channel: TextChannel | null = null

    constructor(name: string, description: string, guild: Guild, ticketowner: string) {
        this.name = name
        this.description = description
        this.guild = guild
        this.ticketowner = ticketowner
        this.createTicket()
    }

    async createTicket() {
        let parent = await this.checkParent()
        console.log(parent)
        await this.guild.channels
            .create({
                name: this.name,
                type: ChannelType.GuildText,
                parent: parent,
                permissionOverwrites: [
                    {
                        id: this.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: process.env.ADMIN_ROLE_ID as string,
                        allow: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: this.ticketowner,
                        allow: [PermissionFlagsBits.ViewChannel],
                    },
                ],
            })
            .then((channel) => {
                this.channel = channel as TextChannel
                this.id = channel.id
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
                    permissionOverwrites: [
                        {
                            id: this.guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: process.env.ADMIN_ROLE_ID as string,
                            allow: [PermissionFlagsBits.ViewChannel],
                        },
                    ],
                })
                .then((channel) => {
                    parent = channel
                })
        }
        return parent?.id
    }
}
