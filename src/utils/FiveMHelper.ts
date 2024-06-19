export function formatPlate(platetext: string): string {
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

export function validatePlate(numberplate: string): boolean | Error {
    if (numberplate.length > 8) {
        return new Error(
            `Das Kennzeichen **${numberplate}** ist zu lang. \nDas Kennzeichen darf maximal 8 Zeichen lang sein.`,
        );
    }
    if (!numberplate.toUpperCase().match(/^[A-Z0-9 ]*$/g)) {
        return new Error(
            `Das Kennzeichen **${numberplate}** enthält ungültige Zeichen. \nDas Kennzeichen darf nur aus Buchstaben und Zahlen bestehen.`,
        );
    }

    return true;
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

export function validatePhoneMediaUrl(url: string): string | null {
    const REGEX =
        /^(https?:\/\/[^\s?#]+\/[^\s?#]+)\.(jpg|jpeg|png|gif|bmp|svg|webp|tiff|ico|mp4|mkv|webm|avi|mov|wmv|flv|m4v|mpeg|mpg)(?:\?.*)?$/;
    const match = url.match(REGEX);
    if (match) {
        return match[1];
    }
    return null;
}
