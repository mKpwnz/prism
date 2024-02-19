import { IValidatedPlayer } from '@interfaces/IValidatedPlayer';
import { EUniqueIdentifier } from '@enums/ESearchType';
import { ILivePlayer } from '@interfaces/ILivePlayer';
import { GameDB } from '@sql/Database';
import { IValidatedPlayerResponse } from '@sql/schema/Player.schema';
import { Cache } from '@utils/Cache';
import LogManager from '@utils/Logger';
import axios from 'axios';

/**
 * @author mKpwnz
 * @date 18.10.2023
 * @export
 * @class PlayerService
 */
export class PlayerService {
    /**
     * @description Get all live players from the server and cache them for 5 minutes.
     * @author mKpwnz
     * @date 18.10.2023
     * @static
     * @returns {*}  {Promise<ILivePlayer[]>}
     * @memberof Player
     */
    public static async getAllLivePlayers(): Promise<ILivePlayer[]> {
        const livePlayers = await Cache.get<ILivePlayer[]>('livePlayers');
        if (!livePlayers) {
            const data = await axios.get('http://gs01.immortaldev.eu:30120/players.json');
            if (data.status === 200) {
                await Cache.set('livePlayers', data.data, 5 * 60 * 1000);
                return data.data;
            }
            LogManager.error('Error while fetching live players from server.');
            return [];
        }
        return livePlayers;
    }

    /**
     * @description Check if a player is Online
     * @author mKpwnz
     * @date 20.10.2023
     * @static
     * @param {string} identifier
     * @returns {*}  {Promise<boolean>}
     * @memberof Player
     */
    public static async isPlayerOnline(identifier: string): Promise<boolean> {
        const livePlayers = await PlayerService.getAllLivePlayers();
        return livePlayers.some((p) => p.identifiers.indexOf(identifier) > -1);
    }

    /**
     * @description Check if a player is Online
     * @author mKpwnz
     * @date 20.10.2023
     * @static
     * @param {string} identifier
     * @returns {*}  {Promise<boolean>}
     * @memberof Player
     */
    public static async getPlayerId(identifier: string): Promise<number> {
        const livePlayers = await PlayerService.getAllLivePlayers();
        return livePlayers.find((p) => p.identifiers.indexOf(identifier) > -1)?.id ?? -1;
    }

    /**
     * @description Validate a player by a given search string and type. Returns null if no player was found. Returns a ValidatedPlayer object if a player was found.
     * @author mKpwnz
     * @date 19.10.2023
     * @static
     * @param {string} searchString
     * @param {EUniqueIdentifier} [type=EUniqueIdentifier.IDENTIFIER]
     * @returns {*}  {(Promise<ValidatedPlayer | null>)}
     * @memberof Player
     */
    public static async validatePlayer(
        searchString: string,
        type: EUniqueIdentifier = EUniqueIdentifier.IDENTIFIER,
    ): Promise<IValidatedPlayer | null> {
        const filterMap = new Map<string, string>([
            [EUniqueIdentifier.IDENTIFIER, `LOWER( users.identifier ) = '${searchString}'`],
            [EUniqueIdentifier.STEAMID, `LOWER( users.steamid ) = '${searchString}'`],
            [EUniqueIdentifier.LICENSE, `LOWER( baninfo.license ) = '${searchString}'`],
            [EUniqueIdentifier.PHONENUMBER, `phone_phones.phone_number = '${searchString}'`],
        ]);
        const [user] = await GameDB.query<IValidatedPlayerResponse[]>(`
            SELECT
                baninfo.playername AS steamnames_current,
                users.name AS steamnames_atFirstLogin,

                baninfo.identifier AS identifiers_steam,
                baninfo.license AS identifiers_license,
                baninfo.liveid AS identifiers_liveid,
                baninfo.xblid AS identifiers_xblid,
                baninfo.discord AS identifiers_discord,
                baninfo.playerip AS identifiers_playerip,

                users.updated AS metadata_lastLogin,

                CONCAT(users.firstname, ' ', users.lastname) as playerdata_fullname,
                users.firstname AS playerdata_firstname,
                users.lastname AS playerdata_lastname,
                users.group AS playerdata_group,
                users.crafting_level AS playerdata_craftingLevel,

                users.accounts AS playerdata_accounts_raw,

                phone_phones.phone_number AS playerdata_phonenumber,

                users.fraksperre AS playerdata_job_fraksperre,
                users.job AS playerdata_job_name,
                users.job_grade AS playerdata_job_grade,

                (SELECT j.label FROM jobs j WHERE j.name = users.job) AS playerdata_job_nameLabel,
                (SELECT jg.label FROM job_grades jg WHERE jg.job_name = users.job AND jg.grade = users.job_grade) AS playerdata_job_gradeLabel

            FROM users
                LEFT JOIN baninfo ON users.identifier = baninfo.identifier
                JOIN phone_phones ON users.identifier = phone_phones.id
            WHERE ${filterMap.get(type)}
        `);

        if (user === null) return null;
        if (user.length !== 1) return null;

        const usr = user[0];
        const iPO = await this.isPlayerOnline(usr.identifiers_steam);
        const cID = await this.getPlayerId(usr.identifiers_steam);

        const accountData = JSON.parse(usr.playerdata_accounts_raw);
        const userObject: IValidatedPlayer = {
            steamnames: {
                current: usr.steamnames_current,
                atFirstLogin: usr.steamnames_atFirstLogin,
            },
            identifiers: {
                steam: usr.identifiers_steam,
                license: usr.identifiers_license,
                liveid: usr.identifiers_liveid === 'no info' ? null : usr.identifiers_liveid,
                xblid: usr.identifiers_xblid === 'no info' ? null : usr.identifiers_xblid,
                discord: usr.identifiers_discord === 'no info' ? null : usr.identifiers_discord,
                playerip: usr.identifiers_playerip,
            },
            metadata: {
                isPlayerOnline: iPO,
                lastLogin: usr.metadata_lastLogin,
                currentID: cID,
            },
            playerdata: {
                fullname: usr.playerdata_fullname,
                firstname: usr.playerdata_firstname,
                lastname: usr.playerdata_lastname,
                group: usr.playerdata_group,
                craftingLevel: usr.playerdata_craftingLevel,
                phonenumber: usr.playerdata_phonenumber,
                accounts: {
                    bank: accountData.bank,
                    money: accountData.money,
                    black_money: accountData.black_money,
                },
                job: {
                    name: usr.playerdata_job_name,
                    grade: usr.playerdata_job_grade,
                    nameLabel: usr.playerdata_job_nameLabel,
                    gradeLabel: usr.playerdata_job_gradeLabel,
                    fraksperre: usr.playerdata_job_fraksperre,
                },
            },
        };

        return userObject;
    }

    /**
     * @description Get a Validated Player by the current Online ID
     * @static
     * @param {number} id
     * @returns {*}  {(Promise<IValidatedPlayer | null>)}
     * @memberof PlayerService
     */
    public static async getPlayerById(id: number): Promise<IValidatedPlayer | null> {
        const livePlayers = await PlayerService.getAllLivePlayers();
        const livePlayerSteamID = livePlayers
            .find((p) => p.id === id)
            ?.identifiers.find((i) => i.startsWith('steam:'));
        if (!livePlayerSteamID) return null;
        const livePlayer = await this.validatePlayer(livePlayerSteamID, EUniqueIdentifier.STEAMID);
        return livePlayer;
    }
}
