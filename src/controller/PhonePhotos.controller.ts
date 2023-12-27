import Config from '@proot/Config';
import { GameDB } from '@sql/Database';
import LogManager from '@utils/Logger';
import { ChatInputCommandInteraction } from 'discord.js';
import { ResultSetHeader } from 'mysql2';
import {
    IPhone,
    IPhoneDarkchatMessages,
    IPhoneInstagramPosts,
    IPhoneMailMessages,
    IPhoneMessages,
    IPhonePhotos,
    IPhoneTiktokMessages,
    IPhoneTinderMessages,
} from '@sql/schema/Phone.schema';

export class PhonePhotosController {
    public static async checkPhotos(start: Date, end: Date): Promise<IPhonePhotos[]> {
        let query = 'SELECT * FROM phone_photos WHERE NOT ';
        for (let i = 0; i < Config.Pictures.AllowedChannels.length; i++) {
            query += `link LIKE '%${Config.Pictures.AllowedChannels[i]}%'`;
            if (i < Config.Pictures.AllowedChannels.length - 1) query += ' AND NOT ';
        }
        query += ` AND timestamp BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'`;
        // LogManager.debug(query)
        const [pictures] = await GameDB.query<IPhonePhotos[]>(query);
        LogManager.log('PhonePhotosController', `Found ${pictures.length} pictures in photos`);
        return pictures;
    }

    public static async deletePhotos(photo: IPhonePhotos[]): Promise<number> {
        let affectedRows = 0;
        for (const picture of photo) {
            const [ret] = await GameDB.execute<ResultSetHeader>(
                `DELETE FROM phone_photos WHERE link = '${picture.link}'`,
            );
            affectedRows += ret.affectedRows;
        }
        return affectedRows;
    }

    public static async checkDarkchat(start: Date, end: Date): Promise<IPhoneDarkchatMessages[]> {
        let query = 'SELECT * FROM phone_darkchat_messages WHERE NOT ';
        for (let i = 0; i < Config.Pictures.AllowedChannels.length; i++) {
            query += `content LIKE '%${Config.Pictures.AllowedChannels[i]}%'`;
            if (i < Config.Pictures.AllowedChannels.length - 1) query += ' AND NOT ';
        }
        query += ` AND timestamp BETWEEN '${start.toISOString()}' AND '${end.toISOString()}' AND content LIKE '%discord%'`;
        // LogManager.debug(query)
        const [messages] = await GameDB.query<IPhoneDarkchatMessages[]>(query);
        LogManager.log('PhonePhotosController', `Found ${messages.length} messages in darkchat`);
        return messages;
    }

    public static async deleteDarkchatMessages(
        messages: IPhoneDarkchatMessages[],
    ): Promise<number> {
        let affectedRows = 0;
        for (const message of messages) {
            const [ret] = await GameDB.execute<ResultSetHeader>(
                `DELETE FROM phone_darkchat_messages WHERE id = '${message.id}'`,
            );
            affectedRows += ret.affectedRows;
        }
        return affectedRows;
    }

    public static async checkInstagram(start: Date, end: Date): Promise<IPhoneInstagramPosts[]> {
        let query = 'SELECT * FROM phone_instagram_posts WHERE NOT ';
        for (let i = 0; i < Config.Pictures.AllowedChannels.length; i++) {
            query += `media LIKE '%${Config.Pictures.AllowedChannels[i]}%'`;
            if (i < Config.Pictures.AllowedChannels.length - 1) query += ' AND NOT ';
        }
        query += ` AND timestamp BETWEEN '${start.toISOString()}' AND '${end.toISOString()}' AND media LIKE '%discord%'`;
        // LogManager.debug(query)
        const [posts] = await GameDB.query<IPhoneInstagramPosts[]>(query);
        LogManager.log('PhonePhotosController', `Found ${posts.length} posts in instagram`);
        return posts;
    }

    public static async deleteInstagramPosts(posts: IPhoneInstagramPosts[]): Promise<number> {
        let affectedRows = 0;
        for (const post of posts) {
            const [ret] = await GameDB.execute<ResultSetHeader>(
                `DELETE FROM phone_instagram_posts WHERE id = '${post.id}'`,
            );
            affectedRows += ret.affectedRows;
        }
        return affectedRows;
    }

    public static async checkMail(start: Date, end: Date): Promise<IPhoneMailMessages[]> {
        let query = 'SELECT * FROM phone_mail_messages WHERE NOT ';
        for (let i = 0; i < Config.Pictures.AllowedChannels.length; i++) {
            query += `attachments LIKE '%${Config.Pictures.AllowedChannels[i]}%' AND NOT content LIKE '%${Config.Pictures.AllowedChannels[i]}%'`;
            if (i < Config.Pictures.AllowedChannels.length - 1) query += ' AND NOT ';
        }
        query += ` AND timestamp BETWEEN '${start.toISOString()}' AND '${end.toISOString()}' AND (content LIKE '%discord%' OR attachments LIKE '%discord%')`;
        // LogManager.debug(query)
        const [messages] = await GameDB.query<IPhoneMailMessages[]>(query);
        LogManager.log('PhonePhotosController', `Found ${messages.length} messages in mail`);
        return messages;
    }

    public static async deleteMailMessages(messages: IPhoneMailMessages[]): Promise<number> {
        let affectedRows = 0;
        for (const message of messages) {
            const [ret] = await GameDB.execute<ResultSetHeader>(
                `DELETE FROM phone_mail_messages WHERE id = '${message.id}'`,
            );
            affectedRows += ret.affectedRows;
        }
        return affectedRows;
    }

    public static async checkMessages(start: Date, end: Date): Promise<IPhoneMessages[]> {
        let query = 'SELECT * FROM phone_message_messages WHERE NOT ';
        for (let i = 0; i < Config.Pictures.AllowedChannels.length; i++) {
            query += `attachments LIKE '%${Config.Pictures.AllowedChannels[i]}%' AND NOT content LIKE '%${Config.Pictures.AllowedChannels[i]}%'`;
            if (i < Config.Pictures.AllowedChannels.length - 1) query += ' AND NOT ';
        }
        query += ` AND timestamp BETWEEN '${start.toISOString()}' AND '${end.toISOString()}' AND (content LIKE '%discord%' OR attachments LIKE '%discord%')`;
        // LogManager.debug(query)
        const [messages] = await GameDB.query<IPhoneMessages[]>(query);
        LogManager.log('PhonePhotosController', `Found ${messages.length} messages in messages`);
        return messages;
    }

    public static async deleteMessages(messages: IPhoneMessages[]): Promise<number> {
        let affectedRows = 0;
        for (const message of messages) {
            const [ret] = await GameDB.execute<ResultSetHeader>(
                `DELETE FROM phone_message_messages WHERE id = '${message.id}'`,
            );
            affectedRows += ret.affectedRows;
        }
        return affectedRows;
    }

    public static async checkTiktok(start: Date, end: Date): Promise<IPhoneTiktokMessages[]> {
        let query = 'SELECT * FROM phone_tiktok_messages WHERE NOT ';
        for (let i = 0; i < Config.Pictures.AllowedChannels.length; i++) {
            query += `content LIKE '%${Config.Pictures.AllowedChannels[i]}%'`;
            if (i < Config.Pictures.AllowedChannels.length - 1) query += ' AND NOT ';
        }
        query += ` AND timestamp BETWEEN '${start.toISOString()}' AND '${end.toISOString()}' AND content LIKE '%discord%'`;
        // LogManager.debug(query)
        const [posts] = await GameDB.query<IPhoneTiktokMessages[]>(query);
        LogManager.log('PhonePhotosController', `Found ${posts.length} posts in tiktok`);
        return posts;
    }

    public static async deleteTiktokPosts(posts: IPhoneTiktokMessages[]): Promise<number> {
        let affectedRows = 0;
        for (const post of posts) {
            const [ret] = await GameDB.execute<ResultSetHeader>(
                `DELETE FROM phone_tiktok_messages WHERE id = '${post.id}'`,
            );
            affectedRows += ret.affectedRows;
        }
        return affectedRows;
    }

    public static async checkTinder(start: Date, end: Date): Promise<IPhoneTinderMessages[]> {
        let query = 'SELECT * FROM phone_tinder_messages WHERE NOT ';
        for (let i = 0; i < Config.Pictures.AllowedChannels.length; i++) {
            query += `content LIKE '%${Config.Pictures.AllowedChannels[i]}%'`;
            if (i < Config.Pictures.AllowedChannels.length - 1) query += ' AND NOT ';
        }
        query += ` AND timestamp BETWEEN '${start.toISOString()}' AND '${end.toISOString()}' AND content LIKE '%discord%'`;
        // LogManager.debug(query)
        const [messages] = await GameDB.query<IPhoneTinderMessages[]>(query);
        LogManager.log('PhonePhotosController', `Found ${messages.length} messages in tinder`);
        return messages;
    }

    public static async deleteTinderMessages(messages: IPhoneTinderMessages[]): Promise<number> {
        let affectedRows = 0;
        for (const message of messages) {
            const [ret] = await GameDB.execute<ResultSetHeader>(
                `DELETE FROM phone_tinder_messages WHERE id = '${message.id}'`,
            );
            affectedRows += ret.affectedRows;
        }
        return affectedRows;
    }

    public static async getDarkchatMessageOwner(message: IPhoneDarkchatMessages): Promise<string> {
        const [query] = await GameDB.query<IPhone[]>(
            `SELECT * FROM phone_phones WHERE phone_number = ${message.channelid}`,
        );

        return query[0].id;
    }

    public static async getPhoneOwner(
        picture:
            | IPhonePhotos
            | IPhoneDarkchatMessages
            | IPhoneInstagramPosts
            | IPhoneMailMessages
            | IPhoneMessages
            | IPhoneTiktokMessages
            | IPhoneTinderMessages,
    ): Promise<string> {
        let querystring: string = '';
        if ('is_video' in picture) {
            // Photos
            querystring = `SELECT * FROM phone_phones WHERE phone_number = ${picture.phone_number}`;
        }
        if ('channel' in picture) {
            // Darkchat
            querystring = `SELECT * FROM phone_phones WHERE phone_number = (SELECT phone_number FROM phone_darkchat_accounts WHERE username = '${picture.sender}')`;
        }
        if ('comment_count' in picture) {
            // Instagram
            querystring = `SELECT * FROM phone_phones WHERE phone_number = (SELECT phone_number FROM phone_instagram_accounts WHERE username = '${picture.username}')`;
        }
        if ('subject' in picture) {
            // Mail
            querystring = `SELECT * FROM phone_phones WHERE phone_number = (SELECT phone_number FROM phone_mail_accounts WHERE username = '${picture.sender}' LIMIT 1)`;
        }
        if ('channel_id' in picture && 'attachments' in picture) {
            // Messages
            querystring = `SELECT * FROM phone_phones WHERE phone_number = ${picture.sender}`;
        }
        if ('channel_id' in picture && !('attachments' in picture)) {
            querystring = `SELECT * FROM phone_phones WHERE phone_number = (SELECT phone_number FROM phone_tiktok_accounts WHERE username = '${picture.sender}')`;
        }
        if ('recipient' in picture && !('subject' in picture)) {
            querystring = `SELECT * FROM phone_phones WHERE phone_number = ${picture.sender}`;
        }
        if (querystring === '') {
            LogManager.debug(picture);
        }
        const [query] = await GameDB.query<IPhone[]>(querystring);
        return query[0] ? query[0].id : 'Unknown';
    }

    public static async getPhoneOwners(
        pictures:
            | IPhonePhotos[]
            | IPhoneDarkchatMessages[]
            | IPhoneInstagramPosts[]
            | IPhoneMailMessages[]
            | IPhoneMessages[]
            | IPhoneTiktokMessages[]
            | IPhoneTinderMessages[],
    ): Promise<string[]> {
        const owners: string[] = [];
        for (const picture of pictures) {
            const owner = await this.getPhoneOwner(picture);
            if (!owners.includes(owner)) owners.push(owner);
        }
        return owners;
    }

    public static async deletePicture(picture: string): Promise<number> {
        let affectedRows = 0;
        const [ret] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM phone_photos WHERE link = '${picture}'`,
        );
        affectedRows += ret.affectedRows;
        const [ret2] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM phone_instagram_posts WHERE media LIKE '%${picture}%'`,
        );
        affectedRows += ret2.affectedRows;
        const [ret3] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM phone_darkchat_messages WHERE content LIKE '%${picture}%'`,
        );
        affectedRows += ret3.affectedRows;
        const [ret4] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM phone_mail_messages WHERE attachments LIKE '%${picture}%' or content LIKE '%${picture}%'`,
        );
        affectedRows += ret4.affectedRows;
        const [ret5] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM phone_message_messages WHERE attachments LIKE '%${picture}%' or content LIKE '%${picture}%'`,
        );
        affectedRows += ret5.affectedRows;
        const [ret6] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM phone_tiktok_messages WHERE content LIKE '%${picture}%'`,
        );
        affectedRows += ret6.affectedRows;
        const [ret7] = await GameDB.execute<ResultSetHeader>(
            `DELETE FROM phone_tinder_messages WHERE attachments LIKE '%${picture}%' or content LIKE '%${picture}%'`,
        );
        affectedRows += ret7.affectedRows;
        return affectedRows;
    }

    public static async deletePictures(pictures: string[]): Promise<number> {
        let deleted = 0;
        for (const picture of pictures) {
            deleted += await this.deletePicture(picture);
        }
        return deleted;
    }

    public static async checkAllPhotos(start: Date, end: Date): Promise<string[]> {
        LogManager.log('PhonePhotosController', 'Checking all photos');
        const pictures = await this.checkPhotos(start, end);
        LogManager.log('Pictures done');
        const darkchat = await this.checkDarkchat(start, end);
        LogManager.log('Darkchat done');
        const instagram = await this.checkInstagram(start, end);
        LogManager.log('Instagram done');
        const mail = await this.checkMail(start, end);
        LogManager.log('Mail done');
        const messages = await this.checkMessages(start, end);
        LogManager.log('Messages done');
        const tiktok = await this.checkTiktok(start, end);
        LogManager.log('Tiktok done');
        const tinder = await this.checkTinder(start, end);
        LogManager.log('Tinder done');

        const picturesOwners = await this.getPhoneOwners(pictures);
        LogManager.log('Pictures owners done');
        const darkchatOwners = await this.getPhoneOwners(darkchat);
        LogManager.log('Darkchat owners done');
        const instagramOwners = await this.getPhoneOwners(instagram);
        LogManager.log('Instagram owners done');
        const mailOwners = await this.getPhoneOwners(mail);
        LogManager.log('Mail owners done');
        const messagesOwners = await this.getPhoneOwners(messages);
        LogManager.log('Messages owners done');
        const tiktokOwners = await this.getPhoneOwners(tiktok);
        LogManager.log('Tiktok owners done');
        const tinderOwners = await this.getPhoneOwners(tinder);
        LogManager.log('Tinder owners done');

        const owners = [
            ...picturesOwners,
            ...darkchatOwners,
            ...instagramOwners,
            ...mailOwners,
            ...messagesOwners,
            ...tiktokOwners,
            ...tinderOwners,
        ];

        return owners;
    }

    public static async checkAllPhotosWithProgress(
        start: Date,
        end: Date,
        interaction: ChatInputCommandInteraction,
        deletePhotos: boolean = false,
    ): Promise<string[]> {
        await interaction.editReply('▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱ 0% / 100% | Checking all photos');
        const pictures = await this.checkPhotos(start, end);
        await interaction.editReply('▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱ 7% / 100% | Checking Darkchat');
        const darkchat = await this.checkDarkchat(start, end);
        await interaction.editReply('▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱ 13% / 100% | Checking Instagram');
        const instagram = await this.checkInstagram(start, end);
        await interaction.editReply('▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱ 20% / 100% | Checking Mail');
        const mail = await this.checkMail(start, end);
        await interaction.editReply('▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱ 26% / 100% | Checking Messages');
        const messages = await this.checkMessages(start, end);
        await interaction.editReply('▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱ 33% / 100% | Checking Tiktok');
        const tiktok = await this.checkTiktok(start, end);
        await interaction.editReply('▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱ 40% / 100% | Checking Tinder');
        const tinder = await this.checkTinder(start, end);
        await interaction.editReply('▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱ 46% / 100% | Checking picture owners');

        const picturesOwners = await this.getPhoneOwners(pictures);
        await interaction.editReply('▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱ 53% / 100% | Checking Darkchat owners');
        const darkchatOwners = await this.getPhoneOwners(darkchat);
        await interaction.editReply('▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱ 59% / 100% | Checking Instagram owners');
        const instagramOwners = await this.getPhoneOwners(instagram);
        await interaction.editReply('▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱ 66% / 100% | Checking Mail owners');
        const mailOwners = await this.getPhoneOwners(mail);
        await interaction.editReply('▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱ 73% / 100% | Checking Messages owners');
        const messagesOwners = await this.getPhoneOwners(messages);
        await interaction.editReply('▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱ 79% / 100% | Checking Tiktok owners');
        const tiktokOwners = await this.getPhoneOwners(tiktok);
        await interaction.editReply('▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱ 86% / 100% | Checking Tinder owners');
        await this.getPhoneOwners(tinder);
        await interaction.editReply('▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱ 93% / 100% | Done with Check, Combining');

        if (deletePhotos) {
            await interaction.editReply('▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱ 93% / 100% | Done with Check, Deleting');
            let deleted = 0;
            deleted += await this.deletePhotos(pictures);
            deleted += await this.deleteDarkchatMessages(darkchat);
            deleted += await this.deleteInstagramPosts(instagram);
            deleted += await this.deleteMailMessages(mail);
            deleted += await this.deleteMessages(messages);
            deleted += await this.deleteTiktokPosts(tiktok);
            deleted += await this.deleteTinderMessages(tinder);

            await interaction.editReply(
                `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ 100% / 100% | Done with Check, Deleted ${deleted} pictures`,
            );
        } else {
            await interaction.editReply(
                '▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ 100% / 100% | Check completed, returning owners',
            );
        }

        const owners = [
            ...picturesOwners,
            ...darkchatOwners,
            ...instagramOwners,
            ...mailOwners,
            ...messagesOwners,
            ...tiktokOwners,
            // ...tinderOwners,
        ];

        return owners;
    }
}
