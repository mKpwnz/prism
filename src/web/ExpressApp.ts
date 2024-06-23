import LogManager from '@prism/manager/LogManager';
import cors from 'cors';
import errorhandler from 'errorhandler';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import Config from '@prism/Config';
import * as bodyParser from 'body-parser';
import v2Router from '@prism/web/router/api/v2/Router';
import handleError from './middleware/ErrorHandler';
import v1Router from './router/api/v1/Router';

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
        this.app.use('/api/v2', v2Router);

        if (Config.ENV.NODE_ENV === 'development') this.app.use(errorhandler());
        this.app.use(handleError);
        this.app.listen(3000, () => {
            LogManager.info('Web API is running on port 3000');
        });
    }
}
