const Config = {
    Discord: {
        ServerID: '973238003092848711', // IMMO Logs
        Channel: {
            WHOIS_UNLIMITED: '1158520784059371590', // Zugriff für alle
            WHOIS_LIMITED: '1158520825180328077', // Zugriff ab HAdmin
            WHOIS_TEBEX: '1158521110401392730',
            WHOIS_TEBEXOLD: '1158520911457161257',
            WHOIS_RENAME: '1158520851377954898',
            WHOIS_ADMIN: '1158520934832029716', // Zugriff ab Admin
            WHOIS_FRAKTIONEN: '1158520966725521449',
            WHOIS_TESTI: '1158521046245310464',
            WHOIS_NOTICE: '1158521015681417277',
            WHOIS_IMAGEUPLOAD: '1158521623448666112',
            WHOIS_CUSTOMPICS_DATASTORE: '1140733564963528704',
        },
        LogChannel: {
            BOT_LOG: '1158521924108955699',
            S1_WAHLEN: '1135909041806258187',
            S1_IMMO_BILLING: '1009567127663034389',
        },
        Users: {
            List: {
                MIKA: '530485414453051402',
                L33V33N: '312132715128553472',
                MANU: '219123072295370754',
                ZMASTER: '469606487312957452',
            },
            GlobalBlocked: [
                '487678405412782082', // Justim
            ],
            GlobalWhitelist: [
                '388818838189375491', // Sparta
                '548588225455849483', // Rigu
                '483002612417822721', // DrGruselig
            ],
        },
        Groups: {
            DEV_BOTTESTER: '1158522410929246258',
            DEV_SERVERENGINEER: '996094054867673189',
            IC_FRAKTIONSVERWALTUNG: '1118190151311573022',
            IC_EVENTVERWALTUNG: '1118194767877111828',
            IC_SUPERADMIN: '1118186209773101127',
            IC_HADMIN: '1118186337573556254',
            IC_ADMIN: '1118186443504898068',
            IC_MOD: '1118186467395653682',
        },
        Emotes: [
            {
                name: 'pbot_beta',
                link: 'https://i.imgur.com/akyHolt.png',
            },
        ],
        BOT_NAME: 'PRISM | Whois V2 :)',
    },
    Pictures: {
        Prism: {
            LOGO_BLUE: 'https://i.imgur.com/NkZDE8l.png',
        },
        WHITESPACE: 'https://i.imgur.com/pdkIDFc.png',
    },
    Commands: {
        Resetpos: {
            DefaultPosition: { x: 229.28, heading: 0.0, z: 30.5, y: -886.76 },
        },
    },
}

export default Config
