import chalk from 'chalk'
import colorize from 'json-colorizer'
import winston, { createLogger, format, transports } from 'winston'
import LokiTransport from 'winston-loki'

/**
 * @description Logger class for logging to console and loki
 * @author mKpwnz
 * @date 30.09.2023
 * @export
 * @class LogManager
 */
export default class LogManager {
    private static logger: winston.Logger

    private static formatLoglevel(loglevel: string): string {
        var uLevel = loglevel.toUpperCase()
        switch (loglevel.toLowerCase()) {
            case 'warn':
                loglevel = chalk.bgHex('#ffc632').hex('#0e0e10')(` ${uLevel} `)
                break
            case 'error':
                loglevel = chalk.bgHex('#e91916').hex('#efeff1')(` ${uLevel} `)
                break
            case 'debug':
                loglevel = chalk.hex('#da5dfa')(uLevel)
                break
            default:
                loglevel = chalk.hex('#0792f1')(uLevel)
                break
        }
        return loglevel
    }
    private static formatMessage(message: any, loglevel: string): any {
        if (typeof message === 'object') {
            return colorize(message, {
                pretty: true,
                colors: {
                    BRACE: '#efeff1',
                    BRACKET: '#efeff1',
                    COLON: '#efeff1',
                    COMMA: '#efeff1',
                    STRING_KEY: '#0792f1',
                    STRING_LITERAL: '#a1fb1a',
                    NUMBER_LITERAL: '#ffc632',
                    BOOLEAN_LITERAL: '#8270fa',
                    NULL_LITERAL: '#e91916',
                },
            })
        } else if (typeof message === 'string') {
            switch (loglevel.toLowerCase()) {
                case 'error':
                    return chalk.hex('#e91916')(message)
                default:
                    return message
            }
        } else {
            return message
        }
    }

    public static async configure() {
        this.logger = createLogger({
            level: process.env.NODE_ENV !== 'production' ? 'debug' : 'warn',
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }),
                format.errors({ stack: true }),
                format.splat(),
                format.printf((info) => {
                    return `${chalk.hex('#adb5ae')(info.timestamp)} ${this.formatLoglevel(
                        info.level,
                    )}: ${this.formatMessage(info.message, info.level)}`
                }),
            ),
            transports: [
                new LokiTransport({
                    host: 'https://logs.immortaldev.eu',
                    labels: { app: 'prism_bot', env: process.env.NODE_ENV },
                    replaceTimestamp: true,
                    json: true,
                    format: format.json(),
                    onConnectionError: (err) => this.error(err),
                }),
                new transports.Console(),
            ],
        })
    }

    public static log(...args: any[]) {
        args.forEach((arg) => {
            this.logger.info(arg)
        })
    }

    public static error(...args: any[]) {
        args.forEach((arg) => {
            this.logger.error(arg)
        })
    }

    public static warn(...args: any[]) {
        args.forEach((arg) => {
            this.logger.warn(arg)
        })
    }

    public static info(...args: any[]) {
        args.forEach((arg) => {
            this.logger.info(arg)
        })
    }

    public static debug(...args: any[]) {
        args.forEach((arg) => {
            this.logger.debug(arg)
        })
    }
}
