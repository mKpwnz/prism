import { DiscordEvents, PrismEvent } from '@prism/types/PrismTypes';

export const EventRegistry: PrismEvent[] = [];

export function RegisterEvent(event: DiscordEvents, triggerOnce: boolean = false) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        EventRegistry.push({
            event,
            once: triggerOnce,
            target,
            propertyKey,
            descriptor,
        });

        return descriptor;
    };
}
