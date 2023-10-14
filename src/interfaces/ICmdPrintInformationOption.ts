export interface ICmdPrintInformationOption {
    name: string
    description: string
    required: boolean
    choices?: {
        name: string
        value: string
    }[]
}
