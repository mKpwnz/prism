import {
    IPhone,
    IPhoneBackups,
    IPhoneClockAlarms,
    IPhoneDarkchatChannels,
    IPhoneDarkchatMessages,
    IPhoneInstagramAccounts,
    IPhoneInstagramComments,
    IPhoneInstagramMessages,
    IPhoneInstagramPosts,
    IPhoneLoggedInAccounts,
    IPhoneMailAccounts,
    IPhoneMailMessages,
    IPhoneMapLocations,
    IPhoneNotes,
    IPhonePhoneCalls,
    IPhonePhoneContacts,
    IPhonePhoneVoiceMails,
    IPhonePhotos,
    IPhoneTiktokAccounts,
    IPhoneTiktokChannels,
    IPhoneTiktokComments,
    IPhoneTiktokMessages,
    IPhoneTiktokVideos,
    IPhoneTwitterAccounts,
    IPhoneTwitterMessages,
    IPhoneTwitterTweets,
    IPhoneVoiceMemoRecordings,
    IPhoneWalletTransactions,
    IPhoneYellowPagesPosts,
} from '@prism/sql/gameSchema/Phone.schema';

export interface IPhoneFullData {
    phone: IPhone;
    backups: IPhoneBackups[];
    apps: {
        clockAlarms: IPhoneClockAlarms[];
        darkchat: IAppDataDarkchat;
        instagram: IAppDataInstagram;
        mail: IAppDataMail;
        tiktok: IAppDataTiktok;
        twitter: IAppDataTwitter;
        yellowPages: IAppDataYellowPages;
    };
    currentSessions: IPhoneLoggedInAccounts[];
    savedLocations: IPhoneMapLocations[];
    notes: IPhoneNotes[];
    blocked: IPhoneBlocked;
    callHistory: IPhonePhoneCalls[];
    voiceMailHistory: IPhonePhoneVoiceMails[];
    savedContacts: IPhonePhoneContacts[];
    savedPhotos: IPhonePhotos[];
    voiceMemoRecordings: IPhoneVoiceMemoRecordings[];
    walletTransactions: IPhoneWalletTransactions[];
}

export interface IAppDataDarkchat {
    username: string | null;
    memberOfChannels: IPhoneDarkchatChannels[];
    messagesSend: IPhoneDarkchatMessages[];
}

export interface IAppDataInstagram {
    accounts: {
        accountData: IPhoneInstagramAccounts;
        comments: IPhoneInstagramComments[];
        messagesSend: IPhoneInstagramMessages[];
        messagesReceived: IPhoneInstagramMessages[];
        posts: IPhoneInstagramPosts[];
    }[];
}

export interface IAppDataMail {
    accounts: {
        accountData: IPhoneMailAccounts;
        messagesSend: IPhoneMailMessages[];
        messagesReceived: IPhoneMailMessages[];
    }[];
}

export interface IAppDataTiktok {
    accounts: {
        accountData: IPhoneTiktokAccounts;
        comments: IPhoneTiktokComments[];
        messagesSend: {
            channel: IPhoneTiktokChannels;
            message: IPhoneTiktokMessages;
        }[];
        video: IPhoneTiktokVideos[];
    }[];
}

export interface IAppDataTwitter {
    accounts: {
        accountData: IPhoneTwitterAccounts;
        messagesSend: IPhoneTwitterMessages[];
        messagesReceived: IPhoneTwitterMessages[];
        tweets: IPhoneTwitterTweets[];
    }[];
}

export interface IAppDataYellowPages {
    posts: IPhoneYellowPagesPosts[];
}

export interface IPhoneBlocked {
    numbers: string[];
    byNumbers: string[];
}
