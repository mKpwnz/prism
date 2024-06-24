import { RowDataPacket } from 'mysql2';

export interface IPhone extends RowDataPacket {
    id: string;
    owner_id: string;
    phone_number: string;
    name: string | null;
    pin: string | null;
    face_id: string | null;
    settings: string | null;
    is_setup: boolean;
    assinged: boolean;
    battery: number;
}

export interface IPhoneBackups extends RowDataPacket {
    id: string;
    phone_number: string;
}

export interface IPhoneClockAlarms extends RowDataPacket {
    id: string;
    phone_number: string;
    hours: string;
    minutes: string;
    label: string;
    enabled: boolean;
}

export interface IPhoneDarkchatAccounts extends RowDataPacket {
    phone_number: number;
    username: string;
}

export interface IPhoneDarkchatChannels extends RowDataPacket {
    name: string;
    last_message: string | null;
    timestamp: Date;
}

export interface IPhoneDarkchatMembers extends RowDataPacket {
    channel_name: string;
    username: string;
}

export interface IPhoneDarkchatMessages extends RowDataPacket {
    id: number;
    channel: string;
    sender: string;
    content: string | null;
    timestamp: Date;
}

export interface IPhoneDarkchatSearch extends RowDataPacket {
    msgID: number;
    channel: string;
    sender: string;
    phone_number: number;
    steamID: string;
    content: string | null;
    timestamp: Date;
}

export interface IPhoneInstagramAccounts extends RowDataPacket {
    displayname: string;
    username: string;
    password: string;
    profile_image: string | null;
    bio: string | null;
    post_count: number;
    story_count: number;
    follower_count: number;
    following_count: number;
    phone_number: number;
    private: boolean;
    verified: boolean;
    date_joined: Date;
}

export interface IPhoneInstagramComments extends RowDataPacket {
    id: string;
    post_id: string;
    username: string;
    content: string;
    like_count: number;
    timestamp: Date;
}

export interface IPhoneInstagramMessages extends RowDataPacket {
    id: string;
    sender: string;
    recipient: string;
    content: string | null;
    attachments: string | null;
    timestamp: Date;
}

export interface IPhoneInstagramPosts extends RowDataPacket {
    id: string;
    media: string | null;
    caption: string;
    location: string | null;
    like_count: number;
    comment_count: number;
    username: string;
    timestamp: Date;
}

export interface IPhoneLoggedInAccounts extends RowDataPacket {
    phone_number: string;
    app: string;
    username: string;
}

export interface IPhoneMailAccounts extends RowDataPacket {
    address: string;
    password: string;
}

export interface IPhoneMailLoggedIn extends RowDataPacket {
    address: string;
    phone_number: string;
}

export interface IPhoneMailMessages extends RowDataPacket {
    id: string;
    recipient: string;
    sender: string;
    subject: string;
    content: string;
    attachments: string | null;
    actions: string | null;
    read: boolean;
    timestamp: Date;
}

export interface IPhoneMapLocations extends RowDataPacket {
    id: string;
    phone_number: string;
    name: string;
    x_pos: number;
    y_pos: number;
}

export interface IPhoneMessageChannels extends RowDataPacket {
    id: number;
    is_group: boolean;
    name: string | null;
    last_message: string;
    last_message_timestamp: Date;
}

export interface IPhoneMessageMembers extends RowDataPacket {
    channel_id: number;
    phone_number: string;
    is_owner: boolean;
    deleted: boolean;
    unread: number;
}

export interface IPhoneMessages extends RowDataPacket {
    id: number;
    channel_id: number;
    sender: string;
    content: string | null;
    attachments: string | null;
    timestamp: Date;
}

export interface IPhoneNotes extends RowDataPacket {
    id: string;
    phone_number: string;
    title: string;
    content: string | null;
    timestamp: Date;
}

export interface IPhoneNotifications extends RowDataPacket {
    id: number;
    phone_number: string;
    app: string;
    title: string | null;
    content: string | null;
    thumbnail: string | null;
    avatar: string | null;
    show_avatar: boolean;
    timestamp: Date;
}

export interface IPhonePhoneBlockedNumbers extends RowDataPacket {
    phone_number: string;
    blocked_number: string;
}

export interface IPhonePhoneCalls extends RowDataPacket {
    id: string;
    caller: string;
    callee: string;
    duration: number;
    answered: boolean;
    hide_caller_id: boolean;
    timestamp: Date;
}

export interface IPhonePhoneContacts extends RowDataPacket {
    contact_phone_number: string;
    firstname: string;
    lastname: string;
    profile_image: string | null;
    email: string | null;
    address: string | null;
    favourite: boolean;
    phone_number: string;
}

export interface IPhonePhoneVoiceMails extends RowDataPacket {
    id: string;
    caller: string;
    callee: string;
    url: string;
    duration: number;
    hide_caller_id: boolean;
    timestamp: Date;
}

export interface IPhonePhotoAlbumPhotos extends RowDataPacket {
    album_id: number;
    photo_id: number;
}

export interface IPhonePhotoAlbums extends RowDataPacket {
    id: number;
    phone_number: string;
    title: string;
}

export interface IPhonePhotos extends RowDataPacket {
    id: number;
    phone_number: string;
    link: string;
    is_video: boolean;
    size: number;
    metadata: string | null;
    is_favourite: boolean;
    timestamp: Date;
}

export interface IPhoneTiktokAccounts extends RowDataPacket {
    name: string;
    bio: string | null;
    avatar: string | null;
    username: string;
    password: string;
    verified: boolean;
    follower_count: number;
    following_count: number;
    like_count: number;
    video_count: number;
    twitter: string | null;
    instagram: string | null;
    show_likes: boolean;
    phone_number: string;
    date_joined: Date;
}

export interface IPhoneTiktokChannels extends RowDataPacket {
    id: string;
    last_message: string;
    member_1: string;
    member_2: string;
    timestamp: Date;
}

export interface IPhoneTiktokComments extends RowDataPacket {
    id: string;
    reply_to: string | null;
    video_id: string;
    username: string;
    comment: string;
    likes: number;
    replies: number;
    timestamp: Date;
}

export interface IPhoneTiktokMessages extends RowDataPacket {
    id: string;
    channel_id: string;
    sender: string;
    content: string;
    timestamp: Date;
}

export interface IPhoneTiktokVideos extends RowDataPacket {
    id: string;
    username: string;
    src: string;
    caption: string | null;
    metadata: string | null;
    music: string | null;
    likes: number;
    comments: number;
    views: number;
    saves: number;
    pinned_comment: string | null;
    timestamp: Date;
}

export interface IPhoneTinderAccounts extends RowDataPacket {
    name: string;
    phone_number: string;
    photos: string | null;
    bio: string | null;
    dob: string;
    is_male: boolean;
    interested_men: boolean;
    interested_women: boolean;
}

export interface IPhoneTinderMessages extends RowDataPacket {
    id: string;
    sender: string;
    recipient: string;
    content: string;
    attachments: string | null;
    timestamp: Date;
}

export interface IPhoneTwitterAccounts extends RowDataPacket {
    display_name: string;
    username: string;
    password: string;
    phone_number: string;
    bio: string | null;
    profile_image: string | null;
    profile_header: string | null;
    pinned_tweet: string | null;
    verified: boolean;
    follower_count: number;
    following_count: number;
    private: boolean;
    date_joined: Date;
}

export interface IPhoneTwitterMessages extends RowDataPacket {
    id: string;
    sender: string;
    recipient: string;
    content: string;
    attachments: string | null;
    timestamp: Date;
}

export interface IPhoneTwitterTweets extends RowDataPacket {
    id: string;
    username: string;
    content: string | null;
    attachments: string | null;
    reply_to: string | null;
    like_count: number;
    reply_count: number;
    retweet_count: number;
    timestamp: Date;
}

export interface IPhoneVoiceMemoRecordings extends RowDataPacket {
    id: string;
    phone_number: string;
    file_name: string;
    file_url: string;
    file_length: number;
    created_at: Date;
}

export interface IPhoneWalletTransactions extends RowDataPacket {
    id: number;
    phone_number: string;
    amount: number;
    company: string;
    logo: string | null;
    timestamp: Date;
}

export interface IPhoneYellowPagesPosts extends RowDataPacket {
    id: string;
    phone_number: string;
    title: string;
    description: string;
    attachments: string | null;
    price: number | null;
    timestamp: Date;
}

export interface IPhone_SQL_MediaCreatorResponse extends RowDataPacket {
    firstname: string;
    lastname: string;
    steamID: string;
    phoneNumber: string;
    timestamp: string;
}

export interface IPhoneFullData {}
