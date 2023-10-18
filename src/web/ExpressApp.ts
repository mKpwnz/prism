import LogManager from '@utils/Logger'
import * as bodyParser from 'body-parser'
import errorhandler from 'errorhandler'
import express, { NextFunction, Request, Response } from 'express'
import { CustomError } from './CustomError'
import EStatusCode from '@enums/EStatusCode'
import { Netmask } from 'netmask'
import * as requestIp from 'request-ip'
import cors from 'cors'
import { Help } from '@commands/system/Help'

export class ExpressApp {
    public app: express.Application

    constructor() {
        this.app = express()
        this.config()
        this.app.use(cors())
        this.app.set('trust proxy', true)
        // this.app.use(this.handlePermissions)

        this.app.get('/commandhelplist', async (req, res) => {
            var cmd = await Help.getCommands()

            // Soll sein Map<string, string> (groupid, group display name)
            var grp = await Help.getGroups()

            // Soll sein Map<string, string> (channelid, channel display name)
            var chan = await Help.getChannel()
            res.send({ commands: cmd, channel: chan, groups: grp })
        })
        this.app.use((req, res, next) => {
            throw new CustomError({ code: EStatusCode.ClientErrorNotFound })
        })
        this.app.use(this.errorhandler)
        this.app.listen(3000, () => {
            LogManager.info('Web API is running on port 3000')
        })
    }

    private config(): void {
        if (process.env.NODE_ENV !== 'production') {
            this.app.use(errorhandler())
        }

        this.app.use(bodyParser.json())
        this.app.use(bodyParser.urlencoded({ extended: false }))
    }

    /**
     * @description
     * @author mKpwnz
     * @date 14.10.2023
     * @private
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @returns {*}
     * @memberof ExpressApp
     * @deprecated Wird nicht mehr benötigt, da die API nur noch über den Reverse Proxy erreichbar ist.
     */
    private handlePermissions(req: Request, res: Response, next: NextFunction) {
        const subnets = [new Netmask('193.42.12.128/28'), new Netmask('10.8.0.0/16')]
        const whitelisted = ['::1', '127.0.0.1', '::ffff:127.0.0.1']
        var ip = requestIp.getClientIp(req)
        if (!ip) throw new CustomError({ code: EStatusCode.ClientErrorUnauthorized })
        ip = ip?.replace('::ffff:', '')
        if (whitelisted.includes(ip)) return next()
        var isInSubnet = false
        subnets.forEach((subnet) => {
            if (subnet.contains(ip ?? '')) isInSubnet = true
        })
        if (!isInSubnet) throw new CustomError({ code: EStatusCode.ClientErrorUnauthorized })
        next()
    }

    /**
     * @description Errorhandler für die API. Wird immer aufgerufen, wenn ein Fehler auftritt. (z.B. 404) (Wird auch in der Konsole geloggt, wenn der Fehler geloggt werden soll.)
     * @author mKpwnz
     * @date 14.10.2023
     * @private
     * @param {Error} err
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     * @returns {*}
     * @memberof ExpressApp
     */
    private errorhandler(err: Error, req: Request, res: Response, next: NextFunction) {
        if (err instanceof CustomError) {
            const { statusCode, errors, logging } = err
            if (logging) {
                LogManager.error({
                    code: err.statusCode,
                    errors: err.errors,
                    stack: err.stack,
                })
            }
            return res.status(statusCode).send({ errors })
        }
        return res.status(500).send({
            status: 500,
            message: err.message,
        })
    }
}
