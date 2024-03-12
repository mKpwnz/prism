import { RowDataPacket } from 'mysql2';

/**
 * @description
 * @author mKpwnz
 * @date 19.10.2023
 * @export
 * @interface IValidatedPlayerResponse
 * @extends {RowDataPacket}
 */
export interface IValidatedPlayerResponse extends RowDataPacket {
    steamnames_current: string;
    steamnames_atFirstLogin: string;
    identifiers_steam: string;
    identifiers_license: string;
    identifiers_liveid: string;
    identifiers_xblid: string;
    identifiers_discord: string;
    identifiers_playerip: string;
    metadata_lastLogin: Date;
    playerdata_fullname: string;
    playerdata_firstname: string;
    playerdata_lastname: string;
    playerdata_group: string;
    playerdata_craftingLevel: number;
    playerdata_accounts_raw: string;
    playerdata_phonenumber: string;
    playerdata_job_fraksperre: Date;
    playerdata_job_name: string;
    playerdata_job_grade: number;
    playerdata_job_nameLabel: string;
    playerdata_job_gradeLabel: string;
}
