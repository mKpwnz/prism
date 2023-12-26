import LogManager from '@utils/Logger';
import * as bodyParser from 'body-parser';
import errorhandler from 'errorhandler';
import express, { NextFunction, Request, Response } from 'express';
import EStatusCode from '@enums/EStatusCode';
import cors from 'cors';
import { Help } from '@commands/system/Help';
import { CustomError } from './CustomError';

export class ExpressApp {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.app.use(cors());
        this.app.set('trust proxy', true);

        this.app.get('/commandhelplist', async (req, res) => {
            const [cmd, grp, chan] = await Promise.all([
                Help.getCommands(),
                Help.getGroups(),
                Help.getChannel(),
            ]);

            res.send({ commands: cmd, channel: chan, groups: grp });
        });
        this.app.use(() => {
            throw new CustomError({ code: EStatusCode.ClientErrorNotFound });
        });
        this.app.use(this.errorhandler);
        this.app.listen(3000, () => {
            LogManager.info('Web API is running on port 3000');
        });
    }

    private config(): void {
        if (process.env.NODE_ENV !== 'production') {
            this.app.use(errorhandler());
        }

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private errorhandler(err: Error, req: Request, res: Response, next: NextFunction) {
        if (err instanceof CustomError) {
            const { statusCode, errors, logging } = err;
            if (logging) {
                LogManager.error({
                    code: err.statusCode,
                    errors: err.errors,
                    stack: err.stack,
                });
            }
            return res.status(statusCode).send({ errors });
        }
        return res.status(500).send({
            status: 500,
            message: err.message,
        });
    }
}
