import { Command } from '@class/Command'
import { RegisterCommand } from '@commands/CommandHandler'
import Config from '@proot/Config'
import { Database } from '@sql/Database'
import LogManager from '@utils/Logger'
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { RowDataPacket } from 'mysql2'

export class Versicherung extends Command {
    constructor() {
        super()
        this.AllowedChannels = [Config.Discord.Channel.WHOIS_TESTI]
        this.AllowedGroups = []
        RegisterCommand(
            new SlashCommandBuilder()
                .setName('versicherung')
                .setDescription('Befehle Rund um die Versicherung')
                .addStringOption((option) =>
                    option
                        .setName('operation')
                        .setDescription('Was möchtest du machen?')
                        .addChoices(
                            { name: 'Prüfen', value: 'check' },
                            { name: 'Hinzufügen', value: 'add' },
                            { name: 'Entfernen', value: 'remove' },
                        )
                        .setRequired(true),
                )
                .addStringOption((option) =>
                    option
                        .setName('kennzeichen')
                        .setDescription('Kennzeichen des Fahrzeuges')
                        .setRequired(true),
                )
                .addNumberOption((option) =>
                    option
                        .setName('dauer')
                        .setDescription('(Hinzufügen): Dauer')
                        .addChoices(
                            { name: '1 Tag', value: 1 },
                            { name: '3 Tage', value: 3 },
                            { name: '7 Tage', value: 7 },
                            { name: '14 Tage', value: 14 },
                            { name: '30 Tage', value: 30 },
                        ),
                )
                .addBooleanOption((option) =>
                    option.setName('premium').setDescription('Premium Versicherung?'),
                ) as SlashCommandBuilder,
            this,
        )
    }
    async execute(interaction: CommandInteraction): Promise<void> {
        const { channel, user, guild } = interaction
        const operation = interaction.options.get('operation')?.value?.toString()
        const kennzeichen = interaction.options.get('kennzeichen')?.value?.toString()
        const dauer = interaction.options.get('dauer')?.value as number
        const premium = interaction.options.get('premium')?.value?.toString()

        let embed = new EmbedBuilder()
            .setColor(0x0792f1)
            .setTimestamp()
            .setAuthor({ name: Config.Discord.BOT_NAME, iconURL: Config.Pictures.Prism.LOGO_BLUE })
            .setFooter({
                text: interaction.user.displayName ?? '',
                iconURL: interaction.user.avatarURL() ?? '',
            })

        if (operation === 'check') {
            if (!kennzeichen) await interaction.reply('Kein Kennzeichen angegeben!')
            try {
                interface IVersicherung {
                    plate: string
                    ts: Date
                    premium: boolean
                }
                let [rows] = (await Database.query(
                    'SELECT * FROM `versicherungen` WHERE `plate` = ?',
                    [kennzeichen],
                )) as RowDataPacket[]
                const versicherung = rows[0] as IVersicherung
                if (!versicherung) {
                    await interaction.reply('Keine Versicherung für ' + kennzeichen + ' gefunden!')
                    return
                }
                embed.setTitle('Versicherung Prüfen')
                let status = '**Nicht Versichert**'
                if (versicherung.ts > new Date()) status = '**Versichert**'
                embed.addFields({
                    name: versicherung.plate,
                    value:
                        status +
                        '\nVersichert bis: ' +
                        versicherung.ts.toLocaleDateString() +
                        ' ' +
                        versicherung.ts.toLocaleTimeString() +
                        '\nPremium: ' +
                        versicherung.premium,
                })
                await interaction.reply({ embeds: [embed] })
            } catch (error) {
                await interaction.reply('Fehler beim Abfragen der Versicherung!')
            }
        } else if (operation === 'add') {
            if (!kennzeichen) {
                await interaction.reply('Kein Kennzeichen angegeben!')
                return
            }
            if (!dauer) {
                await interaction.reply('Keine Dauer angegeben!')
                return
            }
            try {
                interface IVersicherung {
                    plate: string
                    ts: Date
                    premium: boolean
                }
                let [rows] = (await Database.query(
                    'SELECT * FROM `versicherungen` WHERE `plate` = ?',
                    [kennzeichen],
                )) as RowDataPacket[]
                const versicherung = rows[0] as IVersicherung
                if (versicherung) {
                    await Database.query(
                        'UPDATE `versicherungen` SET `ts` = ADDDATE(NOW(), INTERVAL ? DAY), `premium` = ? WHERE `plate` = ?',
                        [dauer, premium ? 1 : 0, versicherung.plate],
                    )
                } else {
                    await Database.query(
                        'INSERT INTO `versicherungen` (`plate`, `ts`, `premium`) VALUES (?, ADDDATE(NOW(), INTERVAL ? DAY), ?)',
                        [kennzeichen, dauer, premium ? 1 : 0],
                    )
                }
                let ts = new Date()
                ts.setDate(ts.getDate() + dauer)
                embed.setTitle('Versicherung Hinzufügen')
                embed.addFields({
                    name: kennzeichen ?? 'Fehler',
                    value:
                        'Versichert bis: ' +
                        ts.toLocaleDateString() +
                        ' ' +
                        ts.toLocaleTimeString() +
                        '\nPremium: ' +
                        (premium ? 'Ja' : 'Nein'),
                })
                await interaction.reply({ embeds: [embed] })
            } catch (error) {
                LogManager.error(error)
                await interaction.reply('Fehler beim Hinzufügen der Versicherung!')
            }
        } else if (operation === 'remove') {
            if (!kennzeichen) await interaction.reply('Kein Kennzeichen angegeben!')
            try {
                interface IVersicherung {
                    plate: string
                    ts: Date
                    premium: boolean
                }
                let [rows] = (await Database.query(
                    'SELECT * FROM `versicherungen` WHERE `plate` = ?',
                    [kennzeichen],
                )) as RowDataPacket[]
                const versicherung = rows[0] as IVersicherung
                if (!versicherung) {
                    await interaction.reply('Keine Versicherung für ' + kennzeichen + ' gefunden!')
                    return
                }
                await Database.query('DELETE FROM `versicherungen` WHERE `plate` = ?', [
                    versicherung.plate,
                ])
                embed.setTitle('Versicherung Entfernen')
                embed.addFields({
                    name: kennzeichen ?? 'Fehler',
                    value:
                        'Versicherung entfernt' +
                        '\nPremium: ' +
                        (versicherung.premium ? 'Ja' : 'Nein') +
                        '\nVersichert bis: ' +
                        versicherung.ts.toLocaleDateString() +
                        ' ' +
                        versicherung.ts.toLocaleTimeString(),
                })
                await interaction.reply({ embeds: [embed] })
            } catch (error) {
                LogManager.error(error)
                await interaction.reply('Fehler beim Entfernen der Versicherung!')
            }
        }
    }
}
