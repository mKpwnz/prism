import { Sentry } from '@prism/Bot';
import Config from '@prism/Config';
import { EEmbedColors } from '@prism/typings/enums/EmbedColors';
import LogManager from '@prism/manager/LogManager';
import { BotDB, GameDB } from '@prism/sql/Database';
import {
    faHousing,
    faImmobay,
    faResult,
    faScans,
    faUsers,
    faVehicles,
} from '@prism/sql/botSchema/BotSchema';
import { getEmbedBase, sendToChannel } from '@prism/utils/DiscordHelper';
import { InferSelectModel, and, desc, eq, isNull, lt, ne, or } from 'drizzle-orm';
import { RowDataPacket } from 'mysql2';

type TActiveUser = Omit<InferSelectModel<typeof faUsers>, 'id' | 'createdAt' | 'updatedAt'>;
type TVehciles = Omit<InferSelectModel<typeof faVehicles>, 'id' | 'createdAt' | 'updatedAt'>;
type THousing = Omit<InferSelectModel<typeof faHousing>, 'id' | 'createdAt' | 'updatedAt'>;
type TImmobay = Omit<InferSelectModel<typeof faImmobay>, 'id' | 'createdAt' | 'updatedAt'>;

interface IFAUser extends RowDataPacket {
    identifier: string;
    firstname: string;
    lastname: string;
    usergroup: string;
    discordid: string;
    accounts: string;
    updated: Date;
}

interface IFAVehicles extends RowDataPacket {
    owner: string;
    plate: string;
    kofferraum: string;
    handschuhfach: string;
}

interface IFAHousing extends RowDataPacket {
    owner: string;
    money: string;
}

interface IFAImmoBay extends RowDataPacket {
    user_id: string;
    money: string;
}

function parseValidJson(str: string) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return undefined;
    }
}

async function logUserTable(scanid: number): Promise<TActiveUser[]> {
    const [activeUsers] = await GameDB.query<IFAUser[]>(
        'SELECT u.identifier as identifier, u.accounts as accounts, u.firstname as firstname, u.lastname as lastname, u.`group` as usergroup, u.updated as updated, b.discord as discordid FROM users u JOIN baninfo b ON u.identifier = b.identifier WHERE u.updated > DATE_SUB(NOW(), INTERVAL 14 DAY)',
    );
    const pgDBdata: TActiveUser[] = [];
    for (const user of activeUsers) {
        const accounts = JSON.parse(user.accounts);
        let bank: string | null = null;
        let black: string | null = null;
        let cash: string | null = null;
        if (accounts.bank) {
            bank = Number(accounts.bank).toFixed(2);
        }
        if (accounts.black_money) {
            black = Number(accounts.black_money).toFixed(2);
        }
        if (accounts.money) {
            cash = Number(accounts.money).toFixed(2);
        }
        pgDBdata.push({
            identifier: user.identifier,
            icname: `${user.firstname} ${user.lastname}`,
            discordid: user.discordid,
            usergroup: user.usergroup,
            scanid,
            bank,
            black,
            cash,
        });
    }
    if (pgDBdata.length === 0) return [];
    await BotDB.insert(faUsers).values(pgDBdata);
    return pgDBdata;
}

async function logVehiclesFromUsers(
    scanid: number,
    activeUsers: TActiveUser[],
): Promise<TVehciles[]> {
    const [vehiclesWithMoney] = await GameDB.query<IFAVehicles[]>(
        'SELECT owner, plate, kofferraum, handschuhfach FROM owned_vehicles WHERE JSON_EXTRACT(kofferraum, "$.c_money_cash") > 0 OR JSON_EXTRACT(handschuhfach, "$.c_money_cash") > 0 OR JSON_EXTRACT(kofferraum, "$.c_money_black") > 0 OR JSON_EXTRACT(handschuhfach, "$.c_money_black") > 0',
    );

    const pgDBdata: TVehciles[] = [];

    for (const vehicle of vehiclesWithMoney) {
        const owner = activeUsers.find((user) => user.identifier === vehicle.owner);
        if (owner) {
            try {
                const kofferraum = parseValidJson(vehicle.kofferraum);
                const handschuhfach = parseValidJson(vehicle.handschuhfach);
                let cash = 0;
                let black = 0;
                if (kofferraum) {
                    if (kofferraum.c_money_cash && kofferraum.c_money_cash > 0) {
                        cash += kofferraum.c_money_cash;
                    }
                    if (kofferraum.c_money_black && kofferraum.c_money_black > 0) {
                        black += kofferraum.c_money_black;
                    }
                }
                if (handschuhfach) {
                    if (handschuhfach.c_money_cash && handschuhfach.c_money_cash > 0) {
                        cash += handschuhfach.c_money_cash;
                    }
                    if (handschuhfach.c_money_black && handschuhfach.c_money_black > 0) {
                        black += handschuhfach.c_money_black;
                    }
                }

                pgDBdata.push({
                    scanid,
                    owner: vehicle.owner,
                    plate: vehicle.plate,
                    green: cash.toFixed(2),
                    black: black.toFixed(2),
                });
            } catch (e) {
                Sentry.captureException(e);
                LogManager.error(e);
            }
        }
    }
    if (pgDBdata.length === 0) return [];
    await BotDB.insert(faVehicles).values(pgDBdata);
    return pgDBdata;
}

async function logHouseMoney(scanid: number, activeUsers: TActiveUser[]): Promise<THousing[]> {
    const [housingMoney] = await GameDB.query<IFAHousing[]>(
        'SELECT owner, money FROM addon_account_data WHERE account_name = "property" AND money > 0',
    );
    const pgDBdata: THousing[] = [];
    for (const house of housingMoney) {
        const owner = activeUsers.find((user) => user.identifier === house.owner);
        if (owner) {
            pgDBdata.push({
                scanid,
                owner: house.owner,
                green: Number(house.money).toFixed(2),
            });
        }
    }
    if (pgDBdata.length === 0) return [];
    await BotDB.insert(faHousing).values(pgDBdata);
    return pgDBdata;
}

async function logImmobayMoney(scanid: number, activeUsers: TActiveUser[]): Promise<TImmobay[]> {
    const [immobayMoney] = await GameDB.query<IFAImmoBay[]>(
        'SELECT user_id, money FROM ecommerce_moneys WHERE money > 0',
    );
    const pgDBdata: TImmobay[] = [];
    for (const immo of immobayMoney) {
        const owner = activeUsers.find((user) => user.identifier === immo.user_id);
        if (owner) {
            pgDBdata.push({
                scanid,
                owner: immo.user_id,
                green: Number(immo.money).toFixed(2),
            });
        }
    }
    if (pgDBdata.length === 0) return [];
    await BotDB.insert(faImmobay).values(pgDBdata);
    return pgDBdata;
}

async function analyzeUsers(
    scanid: number,
    activeUsers: TActiveUser[],
    vehicleData: TVehciles[],
    housingData: THousing[],
    immobayData: TImmobay[],
) {
    const pgDBdata = activeUsers.map((user) => {
        const vehicles = vehicleData.filter((vehicle) => vehicle.owner === user.identifier);
        const housing = housingData.find((house) => house.owner === user.identifier);
        const immobay = immobayData.find((immo) => immo.owner === user.identifier);
        let vehicleGreen = 0;
        let vehicleBlack = 0;
        for (const vehicle of vehicles) {
            vehicleGreen += Number(vehicle.green);
            vehicleBlack += Number(vehicle.black);
        }
        return {
            scanid,
            identifier: user.identifier,
            icname: user.icname,
            usergroup: user.usergroup,
            discordid: user.discordid,
            bank: user.bank,
            black: user.black,
            cash: user.cash,
            vehicleGreen: vehicleGreen.toFixed(2),
            vehicleBlack: vehicleBlack.toFixed(2),
            housingGreen: housing ? housing.green : null,
            immobayGreen: immobay ? immobay.green : null,
            totalGreen: (
                Number(user.bank) +
                Number(user.cash) +
                vehicleGreen +
                (housing ? Number(housing.green) : 0) +
                (immobay ? Number(immobay.green) : 0)
            ).toFixed(2),
            totalBlack: (Number(user.black) + vehicleBlack).toFixed(2),
            totalMoney: (
                Number(user.bank) +
                Number(user.black) +
                Number(user.cash) +
                vehicleGreen +
                vehicleBlack +
                (housing ? Number(housing.green) : 0) +
                (immobay ? Number(immobay.green) : 0)
            ).toFixed(2),
        };
    });
    if (pgDBdata.length === 0) return;

    for (let i = 0; i < pgDBdata.length; i += 100) {
        await BotDB.insert(faResult).values(pgDBdata.slice(i, i + 100));
    }
}

async function sendTeamDiscordNotice() {
    const lastScan = await BotDB.select()
        .from(faScans)
        .orderBy(desc(faScans.id))
        .limit(1)
        .then((res) => res[0]);

    const lastScanResult = await BotDB.select()
        .from(faResult)
        .where(and(eq(faResult.scanid, lastScan.id), ne(faResult.usergroup, 'user')))
        .orderBy(desc(faResult.totalMoney));

    let sumGreenMoney = 0;
    let subBlackMoney = 0;
    for (const entry of lastScanResult) {
        const numGreen = Number(entry.totalMoney);
        const numBlack = Number(entry.totalBlack);
        if (!Number.isNaN(numGreen)) sumGreenMoney += numGreen;
        if (!Number.isNaN(numBlack)) subBlackMoney += numBlack;
    }

    const content = [];
    for (const entry of lastScanResult.slice(0, 10)) {
        content.push(`Spieler: **${entry.icname}** (${entry.identifier})`);
        content.push('```');
        content.push(`Gesamt Grüngeld: ${Number(entry.totalGreen).toLocaleString('de-DE')}€`);
        content.push(`Gesamt Schwarzgeld: ${Number(entry.totalBlack).toLocaleString('de-DE')}€`);
        content.push('---');
        content.push(`Gesamt Geld: ${Number(entry.totalMoney).toLocaleString('de-DE')}€`);
        content.push('```');
    }

    const embed = getEmbedBase({
        title: 'Financial Analytics (top10) Teamler',
        description: `Letzter Scan: **${lastScan.createdAt.toLocaleString('de-DE')}**\nGesamt Grüngeld im Umlauf: **${sumGreenMoney.toLocaleString('de-DE')}€**\nGesamt Schwarzgeld im Umlauf: **${subBlackMoney.toLocaleString('de-DE')}€**\n\n${content.join('\n')}`,
        color: EEmbedColors.ALERT,
    });
    await sendToChannel(embed, Config.Channels.PROD.PRISM_MONEY_LOG);
}

async function sendUserDiscordNotice() {
    const lastScan = await BotDB.select()
        .from(faScans)
        .orderBy(desc(faScans.id))
        .limit(1)
        .then((res) => res[0]);

    const lastScanResult = await BotDB.select()
        .from(faResult)
        .where(
            and(
                eq(faResult.scanid, lastScan.id),
                or(eq(faResult.usergroup, 'user'), isNull(faResult.usergroup)),
            ),
        )
        .orderBy(desc(faResult.totalMoney));

    let sumGreenMoney = 0;
    let subBlackMoney = 0;
    for (const entry of lastScanResult) {
        const numGreen = Number(entry.totalMoney);
        const numBlack = Number(entry.totalBlack);
        if (!Number.isNaN(numGreen)) sumGreenMoney += numGreen;
        if (!Number.isNaN(numBlack)) subBlackMoney += numBlack;
    }

    const content = [];
    for (const entry of lastScanResult.slice(0, 10)) {
        content.push(`Spieler: **${entry.icname}** (${entry.identifier})`);
        content.push('```');
        content.push(`Gesamt Grüngeld: ${Number(entry.totalGreen).toLocaleString('de-DE')}€`);
        content.push(`Gesamt Schwarzgeld: ${Number(entry.totalBlack).toLocaleString('de-DE')}€`);
        content.push('---');
        content.push(`Gesamt Geld: ${Number(entry.totalMoney).toLocaleString('de-DE')}€`);
        content.push('```');
    }

    const embed = getEmbedBase({
        title: 'Financial Analytics (top10)',
        description: `Letzter Scan: **${lastScan.createdAt.toLocaleString('de-DE')}**\nGesamt Grüngeld im Umlauf: **${sumGreenMoney.toLocaleString('de-DE')}€**\nGesamt Schwarzgeld im Umlauf: **${subBlackMoney.toLocaleString('de-DE')}€**\n\n${content.join('\n')}`,
    });
    await sendToChannel(embed, Config.Channels.PROD.PRISM_MONEY_LOG);
}

export async function doFinancialAnalytics() {
    if (Config.ENV.NODE_ENV !== 'production') {
        LogManager.debug('CronJobs: doFinancialAnalytics() will only execute in production.');
        return;
    }
    LogManager.info('Starting Financial Analytics');
    const deleteOldScans = await BotDB.delete(faScans).where(
        lt(faScans.createdAt, new Date(Date.now() - 8 * 60 * 60 * 1000)),
    );
    LogManager.info(`Deleted ${deleteOldScans.rowCount} old Scans (older than 8 hours)`);
    LogManager.info('Creating Scan for Financial Analytics');
    const scan = await BotDB.insert(faScans)
        .values({})
        .returning()
        .then((res) => res[0]);

    LogManager.info(`Created Scan ${scan.id} for Financial Analytics`);
    const activeUsers = await logUserTable(scan.id);
    LogManager.info('Logged Active Users');
    const vehicleData = await logVehiclesFromUsers(scan.id, activeUsers);
    LogManager.info('Logged Vehicle Money');
    const housingData = await logHouseMoney(scan.id, activeUsers);
    LogManager.info('Logged Housing Money');
    const immobayData = await logImmobayMoney(scan.id, activeUsers);
    LogManager.info('Logged Immobay Money');
    await analyzeUsers(scan.id, activeUsers, vehicleData, housingData, immobayData);
    LogManager.info('Finished Financial Analytics');
    await sendUserDiscordNotice();
    await sendTeamDiscordNotice();
}
