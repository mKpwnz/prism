import LogManager from '@utils/Logger';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import errorhandler from 'errorhandler';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import handleError from './middleware/ErrorHandler';
import v1Router from './router/api/v1/Router';
import { EENV } from '@enums/EENV';
import Config from '@Config';

export class ExpressApp {
    public app: Express = express();

    constructor() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(
            rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                limit: 100, // limit each IP to 100 requests per windowMs
            }),
        );
        this.app.get('/commandhelplist', async (req, res) => {
            res.redirect(301, '/api/v1/commandhelplist');
        });
        this.app.use('/api/v1', v1Router);
        // this.app.use(() => {
        //     throw new CustomError({ code: EStatusCode.ClientErrorNotFound });
        // });
        if (Config.ENV.NODE_ENV === 'development') this.app.use(errorhandler());
        this.app.use(handleError);
        this.app.listen(3000, () => {
            LogManager.info('Web API is running on port 3000');
        });
    }
}
