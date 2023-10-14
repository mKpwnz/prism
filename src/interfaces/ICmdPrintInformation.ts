import { ICmdPrintInformationOption } from './ICmdPrintInformationOption'

export interface ICmdPrintInformation {
    commandName: string
    description: string
    production: boolean
    isBeta: boolean
    commandOptions: ICmdPrintInformationOption[]
    subCommands?: ICmdPrintInformation[]
    allowedChannels?: string[]
    allowedGroups?: string[]
}
