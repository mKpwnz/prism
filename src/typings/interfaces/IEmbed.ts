import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import { AttachmentBuilder } from 'discord.js';

export interface IEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export const EmbedFieldSpacer: IEmbedField = { name: '\u200B', value: '\u200B', inline: true };

export interface IEmbedOptions {
    title?: string;
    description: string;
    messageContent?: string;
    fields?: IEmbedField[];
    customImage?: string;
    color?: EEmbedColors | number;
    ephemeral?: boolean;
    files?: AttachmentBuilder[];
}
