/**
 * @author mKpwnz
 * @date 30.09.2023
 * @export
 * @abstract
 * @class DCEvent
 */
export abstract class DCEvent {
    /**
     * @description Gibt an, in welcher Umgebung der Command ausgeführt werden darf.
     * @author mKpwnz
     * @date 14.10.2023
     * @abstract
     * @param {...any[]} args
     * @returns {*}  {Promise<void>}
     * @memberof DCEvent
     */
    abstract process(...args: any[]): Promise<void>;
}
