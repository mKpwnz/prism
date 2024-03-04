import { HelpService } from '@prism/services/HelpService';
import { Router } from 'express';

const v1Router: Router = Router();

v1Router.get('/commandhelplist', async (req, res) => {
    const [cmd, grp, chan] = await Promise.all([
        HelpService.getCommands(),
        HelpService.getGroups(),
        HelpService.getChannel(),
    ]);

    res.send({ commands: cmd, channel: Object.fromEntries(chan), groups: Object.fromEntries(grp) });
});

export default v1Router;
