/**
 * @description
 * @author mKpwnz
 * @date 15.10.2023
 * @export
 * @interface ICmdPrintInformationOption
 */
export interface ICmdPrintInformationOption {
    name: string
    description: string
    required: boolean
    choices?: {
        name: string
        value: string
    }[]
}
