import z from 'zod';

export const PlateValidation = z
    .string()
    .toUpperCase()
    .min(1, {
        message:
            'Das Kennzeichen ist zu kurz.\nDas Kennzeichen muss mindestens 1 Zeichen lang sein.',
    })
    .max(8, {
        message: 'Das Kennzeichen ist zu Lang.\nDas Kennzeichen darf maximal 8 Zeichen lang sein.',
    })
    .regex(/^[A-Z0-9 ]*$/g, {
        message:
            'Das Kennzeichen enthält ungültige Zeichen.\nDas Kennzeichen darf nur aus Buchstaben und Zahlen bestehen.',
    });

