import { RowDataPacket } from 'mysql2'

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IPhone
 * @extends {RowDataPacket}
 */
export interface IPhone extends RowDataPacket {
    id: string
    phone_number: string
    name: string | null
    pin: string | null
    face_id: string | null
    settings: string | null
    is_setup: boolean | null
    assinged: boolean | null
    battery: number
}

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IPhoneDarkchatAccounts
 * @extends {RowDataPacket}
 */
export interface IPhoneDarkchatAccounts extends RowDataPacket {
    phone_number: number
    username: string
}

export interface IPhoneDarkchatMessages extends RowDataPacket {
    id: number
    channel: string
    sender: string
    content: string | null
    timestamp: Date
}

export interface IPhoneDarkchatMembers extends RowDataPacket {
    channel_name: string
    username: string
}

/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface IPhoneInstagramAccounts
 * @extends {RowDataPacket}
 */
export interface IPhoneInstagramAccounts extends RowDataPacket {
    displayname: string
    username: string
    password: string
    profile_image: string | null
    bio: string | null
    phone_number: number
    verified: boolean | null
    date_joined: Date
}

export interface IPhoneInstagramPosts extends RowDataPacket {
    id: string
    media: string | null
    caption: string
    like_count: number
    comment_count: number
    username: string
    timestamp: Date
}

/**
 * @description
 * @author mKpwnz
 * @date 19.10.2023
 * @export
 * @interface IPhoneOwnerResponse
 * @extends {RowDataPacket}
 */
export interface IPhoneOwnerResponse extends RowDataPacket {
    firstname: string
    lastname: string
    steamID: string
    phoneNumber: string
    timestamp: string
}

export interface IPhoneTiktokAccounts extends RowDataPacket {
    name: string
    bio: string | null
    avatar: string | null
    username: string
    password: string
    verified: boolean | null
    follower_count: number
    following_count: number
    like_count: number
    video_count: number
    twitter: string | null
    instagram: string | null
    show_likes: boolean | null
    phone_number: string
    date_joined: Date
}

export interface IPhoneTiktokVideos extends RowDataPacket {
    id: string
    username: string
    src: string
    caption: string | null
    metadata: string | null
    music: string | null
    likes: number
    comments: number
    views: number
    saves: number
    pinned_comment: string | null
    timestamp: Date
}

export interface IPhoneTinderAccounts extends RowDataPacket {
    name: string
    phone_number: string
    photos: string | null
    bio: string | null
    dob: string
    is_male: boolean
    interested_men: boolean
    interested_women: boolean
}

export interface IPhoneTwitterAccounts extends RowDataPacket {
    display_name: string
    username: string
    password: string
    phone_number: string
    bio: string | null
    profile_image: string | null
    profile_header: string | null
    pinned_tweet: string | null
    verified: boolean | null
    follower_count: number
    following_count: number
    date_joined: Date
}

export interface IPhoneTwitterTweets extends RowDataPacket {
    id: string
    username: string
    content: string | null
    attachments: string | null
    reply_to: string | null
    like_count: number | null
    reply_count: number | null
    retweet_count: number | null
    timestamp: Date
}

export interface IPhonePhotos extends RowDataPacket {
    phone_number: string
    link: string
    is_video: boolean | null
    size: number
    timestamp: Date
}

export interface IPhoneNotes extends RowDataPacket {
    id: string
    phone_number: string
    title: string
    content: string
    timestamp: Date
}
