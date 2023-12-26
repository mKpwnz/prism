import EStatusCode from '@enums/EStatusCode';
import LogManager from '@utils/Logger';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import errorhandler from 'errorhandler';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { CustomError } from './CustomError';
import v1Router from './router/api/v1/Router';
import handleError from './middleware/ErrorHandler';

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
                max: 100, // limit each IP to 100 requests per windowMs
            }),
        );
        this.app.set('trust proxy', true);
        this.app.get('/commandhelplist', async (req, res) => {
            res.redirect(301, '/api/v1/commandhelplist');
        });
        this.app.use('/api/v1', v1Router);
        this.app.use(() => {
            throw new CustomError({ code: EStatusCode.ClientErrorNotFound });
        });
        if (process.env.NODE_ENV !== 'production') this.app.use(errorhandler());
        this.app.use(handleError);
        this.app.listen(3000, () => {
            LogManager.info('Web API is running on port 3000');
        });
    }
}
