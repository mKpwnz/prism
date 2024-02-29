export abstract class DCEvent {
    abstract process(...args: any[]): Promise<void>;
}
