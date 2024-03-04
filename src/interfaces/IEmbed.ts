import { EEmbedColors } from '@prism/enums/EmbedColors';
import { AttachmentBuilder } from 'discord.js';

export interface IEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

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
