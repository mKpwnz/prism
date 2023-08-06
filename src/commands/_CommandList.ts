import { ICommand } from '../interfaces/ICommand'
import { downloadPictures } from './DownloadPictures'
import { openTicket } from './OpenTicket'

export const CommandList: ICommand[] = [openTicket, downloadPictures]
