import { Help } from '@commands/system';
import { Router } from 'express';

const v1Router: Router = Router();

v1Router.get('/commandhelplist', async (req, res) => {
    const [cmd, grp, chan] = await Promise.all([
        Help.getCommands(),
        Help.getGroups(),
        Help.getChannel(),
    ]);

    res.send({ commands: cmd, channel: chan, groups: grp });
});

export default v1Router;
