import { EventRegistry } from '@prism/decorators';
import '@prism/events';
import { ArgsOf, DiscordEvents, PrismEvent } from '@prism/typings/PrismTypes';
import { Client } from 'discord.js';
import LogManager from './LogManager';

export default class EventManager {
    private static events: PrismEvent[] = [];

    private static usedEvents(): readonly PrismEvent[] {
        return this.events.reduce<PrismEvent[]>((prev, event, index) => {
            const found = this.events.find((event2) => event.event === event2.event);
            if (found) {
                const foundIndex = this.events.indexOf(found);

                if (foundIndex === index || found.once !== event.once) {
                    prev.push(event);
                }
            }
            return prev;
        }, []);
    }

    public static init(client: Client) {
        for (const entrie of EventRegistry) {
            this.events.push(entrie);
        }
        LogManager.debug(`Initialized ${this.events.length} Events in EventManager`);

        for (const on of this.usedEvents()) {
            if (on.once) {
                client.once(on.event, this.trigger(on.event, client, true));
            } else {
                client.on(on.event, this.trigger(on.event, client));
            }
        }
    }

    static trigger<Event extends DiscordEvents>(
        event: Event,
        client: Client,
        once: boolean = false,
    ): (...params: ArgsOf<Event>) => Promise<any> {
        const responses: any[] = [];

        const eventsToExecute = this.events.filter((on) => on.event === event && on.once === once);
        return async function (...params: ArgsOf<Event>) {
            for (const on of eventsToExecute) {
                const res = await on.descriptor.value(params, client);
                responses.push(res);
            }
            return responses;
        };
    }
}
