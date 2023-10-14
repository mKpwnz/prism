import EStatusCode from '@enums/EStatusCode'

export type CustomErrorContent = {
    message: string
    context?: { [key: string]: any }
}

/**
 * @description Custom Error Klasse für die WebAPI.
 * @author mKpwnz
 * @date 14.10.2023
 * @export
 * @class CustomError
 * @extends {Error}
 */
export class CustomError extends Error {
    /**
     * @description Gibt den Status Code zurück.
     * @author mKpwnz
     * @date 14.10.2023
     * @private
     * @type {EStatusCode}
     * @memberof CustomError
     */
    private readonly _code: EStatusCode

    /**
     * @description Gibt an, ob der Fehler geloggt werden soll oder nicht. (Standard: false) (Nur in Production true)
     * @author mKpwnz
     * @date 14.10.2023
     * @private
     * @type {boolean}
     * @memberof CustomError
     */
    private readonly _logging: boolean

    /**
     * @description Gibt den Kontext des Fehlers zurück. (z.B. { user: { id: 123, name: 'mKpwnz' } }) (Standard: {}) (Nur in Production true)
     * @author mKpwnz
     * @date 14.10.2023
     * @private
     * @type {{ [key: string]: any }}
     * @memberof CustomError
     */
    private readonly _context: { [key: string]: any }

    /**
     * Creates an instance of CustomError.
     * @author mKpwnz
     * @date 14.10.2023
     * @param {{ code?: EStatusCode; message?: string; logging?: boolean; context?: { [key: string]: any } }} [params]
     * @memberof CustomError
     */
    constructor(params?: {
        code?: EStatusCode
        message?: string
        logging?: boolean
        context?: { [key: string]: any }
    }) {
        const { code, message, logging } = params || {}
        super(message || EStatusCode[code ?? EStatusCode.ServerErrorInternal])
        this._code = code || EStatusCode.ServerErrorInternal
        this._logging = logging || false
        this._context = params?.context || {}
    }

    /**
     * @description Gibt die Fehlermeldung zurück. (z.B. [{ message: 'Fehler', context: { user: { id: 123, name: 'mKpwnz' } } }]) (Nur in Production true) (Standard: [{ message: 'Fehler', context: {} }])
     * @author mKpwnz
     * @date 14.10.2023
     * @readonly
     * @memberof CustomError
     */
    get errors() {
        return [{ message: this.message, context: this._context }]
    }

    /**
     * @description Gibt den Statuscode zurück
     * @author mKpwnz
     * @date 14.10.2023
     * @readonly
     * @memberof CustomError
     */
    get statusCode() {
        return this._code
    }

    /**
     * @description Gibt an, ob der Fehler geloggt werden soll oder
     * @author mKpwnz
     * @date 14.10.2023
     * @readonly
     * @memberof CustomError
     */
    get logging() {
        return this._logging
    }
}
