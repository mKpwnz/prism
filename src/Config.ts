import { bool, cleanEnv, host, port, str, url } from 'envalid';
import { version } from '../package.json';

// envalid Documentation für Types: https://www.npmjs.com/package/envalid
const envConfig = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'staging'] }),
    DISCORD_APPID: str(),
    DISCORD_PUBLICKEY: str(),
    DISCORD_TOKEN: str(),
    SQL_HOST: host(),
    SQL_PORT: port(),
    SQL_USER: str(),
    SQL_PASS: str(),
    SQL_DATABASE: str(),
    RCON_HOST: host(),
    RCON_PORT: port(),
    RCON_PASSWORD: str(),
    TEBEX_SECRET_OLD: str(),
    TEBEX_SECRET: str(),
    TEBEX_ENDPOINT: url(),
    GITLAB_HOST: url(),
    GITLAB_TOKEN: str(),
    LDAP_BINDDN: str(),
    LDAP_PASSWORD: str(),
    LDAP_SERVER: str(),
    POSTGRES_HOST: host(),
    POSTGRES_PORT: port(),
    POSTGRES_USER: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_DB: str(),
    TX_ADMIN_ENDPOINT: url(),
    TX_ADMIN_USER: str(),
    TX_ADMIN_PASS: str(),
    TX_ADMIN_VERSION: str(),
    LOGDB_URL: str(),
    GAMESERVER_API_HOST: host(),
    GAMESERVER_API_PORT: port(),
    MINIO_ENDPOINT: host(),
    MINIO_PORT: port(),
    MINIO_SSL: bool(),
    MINIO_ACCESSKEY: str(),
    MINIO_SECRETKEY: str(),
    MINIO_REGION: str(),
    SENTRY_DSN: url(),
});

export function envBasedVariable<T>(opt: { production: T; development: T; staging: T }): T {
    switch (envConfig.NODE_ENV) {
        case 'production':
            return opt.production;
        case 'staging':
            return opt.staging;
        default:
            return opt.development;
    }
}

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
    SKY: '806975734521921606',
    // Admin
    MIKA: '530485414453051402',
    LIZ: '167525544932409344',
    // Senior Moderator
    ANNY: '288084816363126786',
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
    RIKZ: '625243313548558347',
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

const ServerConfig = {
    IMMO_LOGS: '973238003092848711',
    IMMO_TEAM: '1014139131670036531',
    IMMO_DEVS: '1192895296099844116',
};

const BotConfig = {
    CurrentVersion: `${version}-${envConfig.NODE_ENV.toUpperCase().substring(0, 1)}`,
    ServerID: envBasedVariable({
        production: [ServerConfig.IMMO_LOGS, ServerConfig.IMMO_TEAM],
        staging: [ServerConfig.IMMO_DEVS],
        development: [ServerConfig.IMMO_DEVS],
    }),
    Emotes: ['pbot_beta', 'pbot_banned'],
    BOT_NAME: envBasedVariable({
        production: `PRISM | ${version}`,
        staging: `PRISM STAGING | ${version}`,
        development: `PRISM DEV | ${version}`,
    }),
    BOT_USERNAME: envBasedVariable({
        production: 'PRISM',
        staging: 'PRISM_STAGING',
        development: 'PRISM_DEV',
    }),
    BOT_NICKNAME: envBasedVariable({
        production: '𝗣𝗥𝗜𝗦𝗠',
        staging: '𝗣𝗥𝗜𝗦𝗠 𝗦𝗧𝗔𝗚𝗜𝗡𝗚',
        development: '𝗣𝗥𝗜𝗦𝗠 𝗗𝗘𝗩',
    }),
    BOT_LOGO: envBasedVariable({
        production: 'https://s3.immortaldev.eu/prism-static/dc_icon_production.png',
        staging: 'https://s3.immortaldev.eu/prism-static/dc_icon_staging.png',
        development: 'https://s3.immortaldev.eu/prism-static/dc_icon_development.png',
    }),
    BOT_HEADER: envBasedVariable({
        production: 'https://s3.immortaldev.eu/prism-static/dc_header_production.png',
        staging: 'https://s3.immortaldev.eu/prism-static/dc_header_staging.png',
        development: 'https://s3.immortaldev.eu/prism-static/dc_header_development.png',
    }),
    WHITESPACE: 'https://s3.immortaldev.eu/prism-static/bot_whitespace.png',
    GlobalBlockedUsers: [''],
    GlobalWhitelistUsers: [
        UserConfig.SPARTA,
        // UserConfig.RIGU,
        // UserConfig.DRGRUSELIG,
        // UserConfig.KRAUTERBART,
        // UserConfig.MKMICHA,
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

        TEAM_INHABER: '1014139131728756811',
        TEAM_PROJEKTLEITUNG: '1014139131728756810',
        TEAM_STLV_PROJEKTLEITUNG: '1014139131728756809',
        TEAM_SERVERLEITUNG: '1014139131728756807',
        TEAM_HEAD_DEVELOPER: '1180945875841855558',
        TEAM_SERVER_ENGINEER: '1180946503339102339',
        TEAM_WHITELIST_HELFER: '1050321953740828702',

        TEAM_SUPPORT_STAFF: '1014139131670036532',
        TEAM_DEVELOPER_STAFF: '1193249720349491233',
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
        PRISM_MONEY_LOG: '1216740486342250617',

        TEAM_DEV_TODO: '1138406113692356678',
        TEAM_WHITELIST_REQUEST: '1087393034490097767',

        BOT_LOG: '1158521924108955699',
        S1_WAHLEN: '1135909041806258187',
        S1_IMMO_BILLING: '1009567127663034389',
        S1_NAMECHANGE: '1208019318995034162',
        S1_NVHX_BANS: '1004288134831415456',
        S1_CUSTOM_IMAGE_BANLIST: '1202965967567847444',
    },
    STAGING: {
        IMAGE_UPLOAD: '1214172693553750136',
        TESTING: '1193147826641842266',
        TESTING_2: '1209556376859189269',
        TEST_LOG: '1204133095586926622',
    },
    DEV: {
        IMAGE_UPLOAD: '1246155819578560533',
        TESTING: '1246155741262254211',
        TESTING_2: '1246155772430254190',
        TEST_LOG: '1246155795167711294',
    },
};

const CommandConfig = {
    Resetpos: {
        DefaultPosition: { x: 229.28, heading: 0.0, z: 30.5, y: -886.76 },
    },
    PhonePictures: {
        PhoneQueryWildcardStrings: [
            'https://s3.immortaldev.eu/',
            '1158521623448666112',
            '1000335817853636649',
            '1115622919511474176',
            '1140733564963528704',
            'https://r2.fivemanage.com/',
        ],
    },
};

export const Config = {
    Bot: BotConfig,
    Users: UserConfig,
    Groups: GroupConfig,
    Servers: ServerConfig,
    Channels: ChannelConfig,
    Commands: CommandConfig,
    ENV: envConfig,
};

export default Config;
