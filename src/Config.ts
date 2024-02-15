const UserConfig = {
    // Inhaber
    RIGU: '548588225455849483',
    SPARTA: '388818838189375491',
    // Projektleitung
    DRGRUSELIG: '483002612417822721',
    KRAUTERBART: '277574548625293322',
    // Serverleitung
    KZY: '253275221677572097',
    FABI: '373890803421937665',
    TZAZIKI: '602088015644590090',
    KREAAMZY: '746432017683579050',
    DOE: '138971718185254912',
    RAYN: '377926771082788864',
    // Senior Admin
    JUNGLEJANIS: '917031374890876938',
    TES4: '372395897071468545',
    EFORCE: '418762151881211907',
    // Admin
    MIKA: '530485414453051402',
    // Senior Moderator
    ANNY: '288084816363126786',
    LIZ: '167525544932409344',
    // Moderator
    REALYEET: '344263375938912257',
    AMBERLICE: '596792325511053312',
    DARKI: '289109094730825729',
    THELEMONENERGY: '213349321662398464',
    // Vertragsverwaltung
    L33V33N: '312132715128553472',
    // Badfrakverwaltung
    SIFFREDI: '563358548655079436',
    BBEAD: '237999060458405890',
    // Goodfrakverwaltung
    LEROYSMILE: '235770571495964682',
    LILA: '750740886798729228',
    JACKY: '128451691715624960',
    POISEN07: '719279380895105034',
    // Regelwerksverwaltung
    ZMASTER: '469606487312957452',
    // Eventverwaltung
    UNIII: '375599813229805571',
    // Fahrzeugverwaltung
    SCHLAUCHI: '621081555804094484',

    // Head Developer
    MKMICHA: '353246189367328769',
    // Server Engineer
    ELSINAR: '153507094933274624',
    SIRJXSH: '257564404428701697',
    // Developer
    SQUEEZLEX: '319783009018707970',
    MANU: '219123072295370754',
    ETOX: '267093758129078275',
    NOSS: '148182488231968769',
    // Fahrzeug Dev
    JAYTV: '475760475766915072',
    LUCASJHW: '341958600677130240',
    // Gamedesign
    FENA: '1042775228310364201',
    MAREK: '349665849067569152',
    NICETEA: '516037370559332373',
    SEBASTIAN: '613447760628285670',
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
    BOT_NAME: 'PRISM | Immortal V',
    BOT_LOGO: 'https://i.imgur.com/NkZDE8l.png',
    WHITESPACE: 'https://i.imgur.com/pdkIDFc.png',
    GlobalBlockedUsers: [''],
    GlobalWhitelistUsers: [
        UserConfig.SPARTA,
        UserConfig.RIGU,
        UserConfig.DRGRUSELIG,
        UserConfig.KRAUTERBART,
        UserConfig.MKMICHA,
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
        PRISM_BOT: '1158520784059371590',
        PRISM_HIGHTEAM: '1158520825180328077',
        PRISM_TEBEX: '1158521110401392730',
        PRISM_TESTING: '1158521046245310464',
        PRISM_IMAGE_UPLOAD: '1158521623448666112',
        PRISM_CUSTOMPICS_DATASTORE: '1140733564963528704',

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
