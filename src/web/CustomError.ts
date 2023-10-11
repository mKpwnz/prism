import StatusCode from '@enums/StatusCodes'

export type CustomErrorContent = {
    message: string
    context?: { [key: string]: any }
}

export class CustomError extends Error {
    private readonly _code: StatusCode
    private readonly _logging: boolean
    private readonly _context: { [key: string]: any }

    constructor(params?: { code?: StatusCode; message?: string; logging?: boolean; context?: { [key: string]: any } }) {
        const { code, message, logging } = params || {}
        super(message || StatusCode[code ?? StatusCode.ServerErrorInternal])
        this._code = code || StatusCode.ServerErrorInternal
        this._logging = logging || false
        this._context = params?.context || {}
    }

    get errors() {
        return [{ message: this.message, context: this._context }]
    }

    get statusCode() {
        return this._code
    }

    get logging() {
        return this._logging
    }
}
