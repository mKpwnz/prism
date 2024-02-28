export function formatNumberplate(platetext: string): string {
    platetext = platetext.toUpperCase().replace(/[^A-Z0-9 ]*/g, '');
    if (platetext.length === 0) {
        return '        ';
    }
    if (platetext.length === 8) {
        return platetext;
    }
    if (platetext.length > 8) {
        return platetext.slice(0, 8);
    }
    while (platetext.length < 8) {
        if (platetext.length % 2 === 0) {
            platetext = ` ${platetext}`;
        } else {
            platetext += ' ';
        }
        if (platetext.length === 8) {
            return platetext;
        }
    }

    return platetext;
}

export function validateWeaponName(weaponName: string): string | null {
    if (!weaponName.startsWith('WEAPON_')) {
        weaponName = `WEAPON_${weaponName.toUpperCase()}`;
    }
    const weaponList = [
        'WEAPON_DAGGER',
        'WEAPON_BAT',
        'WEAPON_BOTTLE',
        'WEAPON_CROWBAR',
        'WEAPON_FLASHLIGHT',
        'WEAPON_GOLFCLUB',
        'WEAPON_HAMMER',
        'WEAPON_HATCHET',
        'WEAPON_KNUCKLE',
        'WEAPON_KNIFE',
        'WEAPON_MACHETE',
        'WEAPON_SWITCHBLADE',
        'WEAPON_PISTOL',
        'WEAPON_PISTOL_MK2',
        'WEAPON_COMBATPISTOL',
        'WEAPON_APPISTOL',
        'WEAPON_STUNGUN',
        'WEAPON_PISTOL50',
        'WEAPON_SNSPISTOL',
        'WEAPON_SNSPISTOL_MK2',
        'WEAPON_HEAVYPISTOL',
        'WEAPON_VINTAGEPISTOL',
        'WEAPON_FLAREGUN',
        'WEAPON_MARKSMANPISTOL',
        'WEAPON_MICROSMG',
        'WEAPON_SMG',
        'WEAPON_SMG_MK2',
        'WEAPON_ASSAULTSMG',
        'WEAPON_COMBATPDW',
        'WEAPON_MACHINEPISTOL',
        'WEAPON_MINISMG',
        'WEAPON_RAYCARBINE',
        'WEAPON_PUMPSHOTGUN',
        'WEAPON_PUMPSHOTGUN_MK2',
        'WEAPON_SAWNOFFSHOTGUN',
        'WEAPON_ASSAULTSHOTGUN',
        'WEAPON_BULLPUPSHOTGUN',
        'WEAPON_MUSKET',
        'WEAPON_HEAVYSHOTGUN',
        'WEAPON_DBSHOTGUN',
        'WEAPON_AUTOSHOTGUN',
        'WEAPON_ASSAULTRIFLE',
        'WEAPON_ASSAULTRIFLE_MK2',
        'WEAPON_CARBINERIFLE',
        'WEAPON_CARBINERIFLE_MK2',
        'WEAPON_ADVANCEDRIFLE',
        'WEAPON_SPECIALCARBINE',
        'WEAPON_SPECIALCARBINE_MK2',
        'WEAPON_BULLPUPRIFLE',
        'WEAPON_BULLPUPRIFLE_MK2',
        'WEAPON_COMPACTRIFLE',
        'WEAPON_MG',
        'WEAPON_COMBATMG',
        'WEAPON_COMBATMG_MK2',
        'WEAPON_GUSENBERG',
        'WEAPON_SNIPERRIFLE',
        'WEAPON_HEAVYSNIPER',
        'WEAPON_HEAVYSNIPER_MK2',
        'WEAPON_MARKSMANRIFLE',
        'WEAPON_MARKSMANRIFLE_MK2',
        'WEAPON_RPG',
        'WEAPON_GRENADELAUNCHER',
        'WEAPON_GRENADELAUNCHER_SMOKE',
        'WEAPON_MINIGUN',
        'WEAPON_FIREWORK',
        'WEAPON_RAILGUN',
        'WEAPON_HOMINGLAUNCHER',
        'WEAPON_COMPACTLAUNCHER',
        'WEAPON_RAYMINIGUN',
        'WEAPON_GRENADE',
        'WEAPON_BZGAS',
        'WEAPON_SMOKEGRENADE',
        'WEAPON_FLARE',
        'WEAPON_MOLOTOV',
        'WEAPON_STICKYBOMB',
        'WEAPON_PROXMINE',
        'WEAPON_SNOWBALL',
        'WEAPON_PIPEBOMB',
        'WEAPON_BALL',
        'WEAPON_PARACHUTE',
        'WEAPON_FIREEXTINGUISHER',
        'WEAPON_PETROLCAN',
        'WEAPON_HARZARDCAN',
        'WEAPON_STUNSHOT',
    ];
    if (!weaponList.includes(weaponName)) {
        return null;
    }
    return weaponName;
}

export function generateOAAThash(inputText: string): number {
    const input = inputText.toLowerCase();
    let hash = 0;
    for (let i = 0; i < input.length; ++i) {
        hash += input.charCodeAt(i);
        hash += hash << 10;
        hash ^= hash >>> 6;
    }
    hash += hash << 3;
    hash ^= hash >>> 11;
    hash += hash << 15;
    return (hash >>> 0) >> 0;
}
