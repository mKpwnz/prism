const UserConfig = {
    MIKA: '530485414453051402',
    L33V33N: '312132715128553472',
    MANU: '219123072295370754',
    ZMASTER: '469606487312957452',
    EFORCE: '418762151881211907',
    JUSTIM: '487678405412782082',

    SCHLAUCHI: '621081555804094484',
    SPARTA: '388818838189375491',
    RIGU: '548588225455849483',
    DRGRUSELIG: '483002612417822721',
    KRAUTERBART: '483002612417822721',
    MKMICHA: '353246189367328769'
};

const BotConfig = {
    ServerID: (() => {
        switch (process.env.NODE_ENV) {
            case 'production':
                return '973238003092848711';
            default:
                return '1192895296099844116';
        }
    })(),
    Emotes: [
        {
            name: 'pbot_beta',
            link: 'https://i.imgur.com/akyHolt.png',
        },
        {
            name: 'pbot_banned',
            link: 'https://i.imgur.com/ZvpqMBv.png',
        },
    ],
    BOT_NAME: 'PRISM | Whois V2 :)',
    BOT_LOGO: 'https://i.imgur.com/NkZDE8l.png',
    WHITESPACE: 'https://i.imgur.com/pdkIDFc.png',
    GlobalBlockedUsers: [
        UserConfig.JUSTIM,
    ],
    GlobalWhitelistUsers: [
        UserConfig.SPARTA,
        UserConfig.RIGU,
        UserConfig.DRGRUSELIG,
        UserConfig.KRAUTERBART,
        UserConfig.MKMICHA
    ],
};

const GroupConfig = {
    PROD: {
        SERVERENGINEER: '996094054867673189',
        BOT_DEV: '1201264296924041226',


        IC_FRAKTIONSVERWALTUNG: '1118190151311573022',
        IC_EVENTVERWALTUNG: '1118194767877111828',
        IC_SUPERADMIN: '1118186209773101127',
        IC_HADMIN: '1118186337573556254',
        IC_ADMIN: '1118186443504898068',
        IC_MOD: '1118186467395653682',
    
    },
    DEV: {
        BOTTEST: '1193511629426544742',
    },
};

const ChannelConfig = {
    PROD: {
        WHOIS_UNLIMITED: '1158520784059371590', // Zugriff für alle
        WHOIS_LIMITED: '1158520825180328077', // Zugriff ab HAdmin
        WHOIS_TEBEX: '1158521110401392730',
        WHOIS_TEBEXOLD: '1158520911457161257',
        WHOIS_RENAME: '1158520851377954898',
        WHOIS_TESTI: '1158521046245310464',
        WHOIS_ADMIN: '1158520934832029716', // Zugriff ab Admin
        WHOIS_FRAKTIONEN: '1158520966725521449',
        WHOIS_NOTICE: '1158521015681417277',
        WHOIS_IMAGEUPLOAD: '1158521623448666112',
        WHOIS_CUSTOMPICS_DATASTORE: '1140733564963528704',

        BOT_LOG: '1158521924108955699',
        S1_WAHLEN: '1135909041806258187',
        S1_IMMO_BILLING: '1009567127663034389',
    },
    DEV: {
        PRISM_TESTING: '1193147826641842266',
    },
};

const CommandConfig = {
    Resetpos: {
        DefaultPosition: { x: 229.28, heading: 0.0, z: 30.5, y: -886.76 },
    },
    PhonePictures: {
        AllowedDiscordChannels: [
            '1158521623448666112',
            '1000335817853636649',
            '1115622919511474176',
            '1140733564963528704',
        ],
    },
};

export const Config = {
    Bot: BotConfig,
    Users: UserConfig,
    Groups: GroupConfig,
    Channels: ChannelConfig,
    Commands: CommandConfig,
};

export default Config;
