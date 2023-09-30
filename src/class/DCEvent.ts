/**
 * @author mKpwnz
 * @date 30.09.2023
 * @export
 * @abstract
 * @class DCEvent
 */
export abstract class DCEvent {
    abstract process(...args: any[]): Promise<void>
}
