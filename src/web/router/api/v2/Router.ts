import { HelpService } from '@prism/services/HelpService';
import { Router } from 'express';

const v2Router: Router = Router();

v2Router.get('/commands', async (req, res) => {
    const [commands, groups, channel] = await Promise.all([
        HelpService.getCommands(),
        HelpService.getGroupsV2(),
        HelpService.getChannelV2(),
    ]);

    res.send({ commands, channel, groups });
});

export default v2Router;
