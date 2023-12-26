import { ICmdPrintInformationOption } from './ICmdPrintInformationOption';

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface ICmdPrintInformation
 */
export interface ICmdPrintInformation {
    commandName: string;
    description: string;
    production: boolean;
    isBeta: boolean;
    commandOptions: ICmdPrintInformationOption[];
    subCommands?: ICmdPrintInformation[];
    allowedChannels?: string[];
    allowedGroups?: string[];
}
